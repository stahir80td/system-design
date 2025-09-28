package main

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Problem struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	LeetCodeURL string   `json:"leetcode_url"`
	Companies   []string `json:"companies"`
	Difficulty  string   `json:"difficulty"`
	Description string   `json:"description"`
}

type SolveReq struct {
	ProblemID  *int   `json:"problemId"`
	UserPrompt string `json:"userPrompt"`
	Language   string `json:"language"` // python | go | java
}

type SolveResp struct {
	SolutionCode    string `json:"solutionCode"`
	Explanation     string `json:"explanation"`
	TimeComplexity  string `json:"timeComplexity"`
	SpaceComplexity string `json:"spaceComplexity"`
	BigOExplainer   string `json:"bigOExplainer"`
}

var problems []Problem

//go:embed data/top300.json
var top300Bytes []byte

// Simple in-memory cache with naive TTL
type cacheEntry struct {
	Resp      SolveResp
	ExpiresAt time.Time
}

var cache = map[string]cacheEntry{}

func loadData() {
	if err := json.Unmarshal(top300Bytes, &problems); err != nil {
		log.Printf("Failed to parse data/top300.json: %v\nProblematic JSON: %s", err, string(top300Bytes))
		log.Println("Please check data/top300.json for syntax errors (e.g., trailing commas, unclosed brackets) and ensure it contains a complete array of 300 problems.")
		// Continue with empty problems list instead of fatal
		problems = []Problem{}
	}
}

func allowCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

func getProblems(w http.ResponseWriter, r *http.Request) {
	allowCORS(w)
	diff := r.URL.Query().Get("difficulty")
	var out []Problem
	for _, p := range problems {
		if diff != "" && !strings.EqualFold(p.Difficulty, diff) {
			continue
		}
		out = append(out, p)
	}
	b, _ := json.Marshal(out)
	w.Header().Set("Content-Type", "application/json")
	w.Write(b)
}

func keyFor(req SolveReq) string {
	id := "custom:" + strings.TrimSpace(req.UserPrompt)
	if req.ProblemID != nil {
		id = "pid:" + strconv.Itoa(*req.ProblemID)
	}
	return id + "|lang:" + strings.ToLower(req.Language)
}

func solveHandler(w http.ResponseWriter, r *http.Request) {
	allowCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req SolveReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	lang := strings.ToLower(strings.TrimSpace(req.Language))
	if lang != "python" && lang != "go" && lang != "java" {
		lang = "python"
	}
	// cache
	ckey := keyFor(req)
	if ent, ok := cache[ckey]; ok && time.Now().Before(ent.ExpiresAt) {
		writeJSON(w, ent.Resp)
		return
	}
	// look up problem if provided
	var title, url, description string
	if req.ProblemID != nil {
		for _, p := range problems {
			if p.ID == *req.ProblemID {
				title = p.Title
				url = p.LeetCodeURL
				description = p.Description
				break
			}
		}
	}
	// Pass description to model prompt
	resp, err := callModelOrMock(title, url, description, req.UserPrompt, lang)
	if err != nil {
		log.Printf("model error: %v", err)
		http.Error(w, "model error", http.StatusBadGateway)
		return
	}
	cache[ckey] = cacheEntry{Resp: resp, ExpiresAt: time.Now().Add(1 * time.Hour)}
	writeJSON(w, resp)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	b, _ := json.Marshal(v)
	w.Write(b)
}

func health(w http.ResponseWriter, r *http.Request) {
	allowCORS(w)
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"ok":true}`))
}

// --------- Gemini client ----------

// Content represents a piece of content in the Gemini API.
type Content struct {
	Parts []Part `json:"parts"`
	Role  string `json:"role,omitempty"`
}

// Part represents a part of the content, which can be text.
type Part struct {
	Text string `json:"text,omitempty"`
}

// GenerateContentRequest is the request body for the Gemini GenerateContent API.
type GenerateContentRequest struct {
	Contents []Content `json:"contents"`
}

// GenerateContentResponse is the response body from the Gemini GenerateContent API.
type GenerateContentResponse struct {
	Candidates     []Candidate `json:"candidates"`
	PromptFeedback *struct {
		BlockReason string `json:"blockReason"`
	} `json:"promptFeedback,omitempty"`
}

// Candidate represents a generated response from the model.
type Candidate struct {
	Content       Content       `json:"content"`
	FinishReason  string        `json:"finishReason"`
	SafetyRatings []interface{} `json:"safetyRatings"`
	TokenCount    int           `json:"tokenCount"`
}

func buildPrompt(title, url, description, userPrompt, lang string) string {
	if title == "" {
		title = "Custom Prompt"
	}
	if url == "" {
		url = "N/A"
	}
	if description == "" {
		description = "No description provided."
	}

	return fmt.Sprintf(`You are an interview coding coach. Return STRICT JSON matching the schema below.
Do not quote or reproduce copyrighted problem text. Use idiomatic %s.

Task: Solve an interview-style problem.
Language: %s
ProblemTitle: %s
ProblemURL: %s
ProblemDescription: %s
UserContext: %s

Return JSON ONLY:
{
  "solution_code": "<runnable %s code>",
  "explanation": "<clear approach>",
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "big_o_explainer": "<why those bounds>"
}`, lang, lang, title, url, description, userPrompt, lang)
}

func callModelOrMock(title, url, description, userPrompt, lang string) (SolveResp, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		// Use a valid Gemini model name
		model = "gemini-pro-latest"
	}
	if apiKey == "" {
		// Fallback mock for local dev
		log.Println("GEMINI_API_KEY not set, returning mock response.")
		return mockSolve(lang, title, userPrompt), nil
	}

	fullPrompt := buildPrompt(title, url, description, userPrompt, lang)

	reqBody := GenerateContentRequest{
		Contents: []Content{
			{
				Role: "user",
				Parts: []Part{
					{Text: fullPrompt},
				},
			},
		},
	}

	bodyBytes, _ := json.Marshal(reqBody)

	// Gemini API endpoint format
	apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	req, err := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return SolveResp{}, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return SolveResp{}, fmt.Errorf("API request failed: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(res.Body)
		var apiErr struct {
			Error struct {
				Code    int    `json:"code"`
				Message string `json:"message"`
				Status  string `json:"status"`
			} `json:"error"`
		}
		if json.Unmarshal(bodyBytes, &apiErr) == nil && apiErr.Error.Message != "" {
			return SolveResp{}, fmt.Errorf("Gemini API error %d: %s", res.StatusCode, apiErr.Error.Message)
		}
		return SolveResp{}, fmt.Errorf("Gemini API error %d: %s", res.StatusCode, string(bodyBytes))
	}

	var decodedResp GenerateContentResponse
	if err := json.NewDecoder(res.Body).Decode(&decodedResp); err != nil {
		return SolveResp{}, fmt.Errorf("failed to decode Gemini API response: %w", err)
	}

	if decodedResp.PromptFeedback != nil && decodedResp.PromptFeedback.BlockReason != "" {
		return SolveResp{}, fmt.Errorf("Gemini API blocked prompt: %s", decodedResp.PromptFeedback.BlockReason)
	}
	if len(decodedResp.Candidates) == 0 || len(decodedResp.Candidates[0].Content.Parts) == 0 {
		return SolveResp{}, fmt.Errorf("empty or malformed response from Gemini API")
	}

	raw := decodedResp.Candidates[0].Content.Parts[0].Text

	start := strings.Index(raw, "{")
	end := strings.LastIndex(raw, "}")
	if start == -1 || end == -1 || end <= start {
		log.Printf("Warning: Could not find JSON in Gemini response, falling back to mock. Raw response: %s", raw)
		return mockSolve(lang, title, userPrompt), nil
	}
	jsonPart := raw[start : end+1]

	var out struct {
		SolutionCode    string `json:"solution_code"`
		Explanation     string `json:"explanation"`
		TimeComplexity  string `json:"time_complexity"`
		SpaceComplexity string `json:"space_complexity"`
		BigOExplainer   string `json:"big_o_explainer"`
	}
	if err := json.Unmarshal([]byte(jsonPart), &out); err != nil {
		log.Printf("Warning: Failed to unmarshal JSON from Gemini response, falling back to mock. JSON part: %s, Error: %v", jsonPart, err)
		return mockSolve(lang, title, userPrompt), nil
	}
	// Basic normalization
	if out.TimeComplexity == "" {
		out.TimeComplexity = "O(n)"
	}
	if out.SpaceComplexity == "" {
		out.SpaceComplexity = "O(1)"
	}
	return SolveResp{
		SolutionCode:    out.SolutionCode,
		Explanation:     out.Explanation,
		TimeComplexity:  out.TimeComplexity,
		SpaceComplexity: out.SpaceComplexity,
		BigOExplainer:   out.BigOExplainer,
	}, nil
}

func mockSolve(lang, title, userPrompt string) SolveResp {
	code := ""
	switch lang {
	case "python":
		code = "def solve(nums):\n    # example: return sorted(nums)\n    return sorted(nums)\n\n# Example\nprint(solve([3,1,2]))"
	case "go":
		code = `package main

import (
	"fmt"
	"sort"
)

func solve(nums []int) []int {
	sort.Ints(nums)
	return nums
}

func main() {
	fmt.Println(solve([]int{3, 1, 2}))
}`
	case "java":
		code = "import java.util.*;\npublic class Solution{\n  public int[] solve(int[] nums){ Arrays.sort(nums); return nums; }\n  public static void main(String[] a){ System.out.println(Arrays.toString(new Solution().solve(new int[]{3,1,2}))); }\n}"
	}
	return SolveResp{
		SolutionCode:    code,
		Explanation:     "Mock response (set GEMINI_API_KEY to enable real Gemini calls). This example demonstrates sorted output.",
		TimeComplexity:  "O(n log n)",
		SpaceComplexity: "O(1) || O(n) depending on sort",
		BigOExplainer:   "Dominated by sorting step.",
	}
}

// fileServer serves static files and handles client-side routing
func fileServer(fs http.FileSystem) http.Handler {
	fsh := http.FileServer(fs)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Try to serve the file
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Check if file exists
		f, err := fs.Open(filepath.Clean(path))
		if err != nil {
			// If file doesn't exist and it's not an API route, serve index.html (for SPA routing)
			if !strings.HasPrefix(path, "/api/") {
				r.URL.Path = "/index.html"
			}
		} else {
			f.Close()
		}

		fsh.ServeHTTP(w, r)
	})
}

func main() {
	_ = godotenv.Load()
	loadData()

	// API routes
	http.HandleFunc("/api/health", health)
	http.HandleFunc("/api/problems", getProblems)
	http.HandleFunc("/api/solve", solveHandler)

	// Serve static files from the public directory (built React app)
	staticDir := "./public"
	if _, err := os.Stat(staticDir); err == nil {
		fs := http.Dir(staticDir)
		http.Handle("/", fileServer(fs))
		log.Printf("Serving static files from %s", staticDir)
	} else {
		log.Printf("Warning: Static directory %s not found. Only API endpoints will be available.", staticDir)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
