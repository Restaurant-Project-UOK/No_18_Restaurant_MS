# AI Service (ChatBot) - NO18 Restaurant

## Overview
The AI Service is an intelligent chatbot system designed for NO18 Restaurant in Kelaniya. It provides instant answers to customer queries about menu items, prices, categories, and general restaurant information using advanced AI and a knowledge base.

## Key Features
- **Chatbot Widget**: Embeddable chat widget for websites, allowing customers to interact directly.
- **Menu Q&A**: Answers questions about menu items, prices, and categories using data from the restaurant's database.
- **Contextual Memory**: Remembers conversation context for more natural, multi-turn interactions.
- **Weather Info**: Can provide weather updates (if API key is configured).
- **Modern UI**: Clean, user-friendly chat interface.

## Technical Details
- **Framework**: FastAPI (Python)
- **AI Model**: Azure OpenAI (via LangChain)
- **Database**: MongoDB (menu data)
- **Vector Store**: ChromaDB for semantic search (RAG)
- **Frontend**: HTML/CSS/JS widget, embeddable via `embed.js`
- **APIs**:
  - `/widget`: Chatbot UI (iframe)
  - `/embed.js`: Script to embed the widget
  - `/ask`: JSON API for Q&A

## How It Works
1. **User asks a question** in the chat widget.
2. **AI agent** retrieves relevant menu info from MongoDB using semantic search (RAG).
3. **Response is generated** using Azure OpenAI and sent back to the user.
4. **Conversation memory** enables follow-up questions.

## For Presentation Slides
- **Purpose**: Enhance customer experience with instant, AI-powered answers.
- **Tech Stack**: FastAPI, Azure OpenAI, MongoDB, LangChain, ChromaDB.
- **Unique Value**: Combines restaurant data with conversational AI for smart, context-aware support.

---
