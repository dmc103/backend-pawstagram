const express = require("express");
const router = express.Router();

//ChatGPT API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

router.post("/chatbot", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error calling ChatGpt API", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

module.exports = router;
