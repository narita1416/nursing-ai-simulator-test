import express from "express";

const app = express();

app.use(express.json());
app.use(express.static("."));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/chat", async (req, res) => {
  try {
    const { userMessage } = req.body;

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY が読み込めていません。");
      return res.json({ reply: "Gemini APIキーが読み込めていません。" });
    }

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "あなたは病室で車椅子に座っている80代男性です。脳卒中発症後、左上下肢麻痺があるため、車椅子に座っています。聞かれないと必要な情報は全て話しません。尿意があります。学生の質問に対して、患者本人として自然に短く答えてください。返答は日本語で1〜2文にしてください。\n\n" +
                  `学生: ${userMessage}`
              }
            ]
          }
        ]
      })
    });

    const rawText = await response.text();
    console.log("Gemini status:", response.status);
    console.log("Gemini raw:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.json({ reply: "Geminiの返答を読み取れませんでした。" });
    }

    if (!response.ok) {
      const message =
        data?.error?.message || `Gemini APIエラー (${response.status})`;
      return res.json({ reply: message });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Geminiから本文が返ってきませんでした。";

    res.json({ reply });
  } catch (error) {
    console.error("server error:", error);
    res.json({ reply: "サーバー側でエラーが発生しました。" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
