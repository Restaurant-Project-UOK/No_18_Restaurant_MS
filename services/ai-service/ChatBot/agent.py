# agent.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# ------------------------- ✅ LangChain Imports -------------------------
from langchain_community.chat_models import AzureChatOpenAI
from langchain_openai import AzureOpenAIEmbeddings
from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.tools import Tool
from langchain import hub
from langchain.agents import create_react_agent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain.agents import load_tools

# ======================================================
# ✅ Load Environment Variables
# ======================================================
load_dotenv()

AZURE_API_KEY = os.getenv("AZURE_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION")
MONGO_URI = os.getenv("MONGO_URI")

if not all([AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT, AZURE_API_VERSION]):
    raise EnvironmentError("❌ Missing one or more Azure environment variables!")

# ======================================================
# ✅ Initialize Azure OpenAI
# ======================================================
llm = AzureChatOpenAI(
    azure_deployment=AZURE_DEPLOYMENT,
    api_key=AZURE_API_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    api_version=AZURE_API_VERSION,
    temperature=0
)

embeddings = AzureOpenAIEmbeddings(
    model="text-embedding-3-large",
    azure_endpoint=AZURE_ENDPOINT,
    api_key=AZURE_API_KEY,
    openai_api_version=AZURE_API_VERSION,
)

# ======================================================
# ✅ MongoDB Connection
# ======================================================
if not MONGO_URI:
    raise EnvironmentError("❌ Missing MONGO_URI environment variable!")

client = MongoClient(MONGO_URI)
db = client["restaurant_db"]
collection = db["menu_items"]

# ======================================================
# ✅ Load MongoDB Documents
# ======================================================
def load_mongo_documents():
    rows = list(collection.find())
    docs = []

    for row in rows:
        name = row.get("name", "")
        description = row.get("description", "")
        price = row.get("price", "")
        category = row.get("category", "")

        if not description.strip():
            continue

        text = f"Name: {name}\nDescription: {description}\nPrice: {price}\nCategory: {category}"
        metadata = {k: v for k, v in row.items() if k != "_id"}
        docs.append(Document(page_content=text, metadata=metadata))

    print(f"✅ Loaded {len(docs)} documents from MongoDB.")
    return docs


docs = load_mongo_documents()
if not docs:
    raise ValueError("❌ No documents found in MongoDB!")

# ======================================================
# ✅ Chunk and Embed
# ======================================================
splitter = RecursiveCharacterTextSplitter(chunk_size=150, chunk_overlap=20)
chunks = splitter.split_documents(docs)

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="chroma_db"
)
vectorstore.persist()
retriever = vectorstore.as_retriever()

# ======================================================
# ✅ RAG Tool
# ======================================================
def rag_tool_func(query: str) -> str:
    results = retriever.get_relevant_documents(query)
    return "\n\n".join([doc.page_content for doc in results])

rag_tool = Tool(
    name="RAGRetriever",
    func=rag_tool_func,
    description="Searches internal menu knowledge base for restaurant items."
)

# ======================================================
# ✅ Weather Tool
# ======================================================
os.environ["OPENWEATHERMAP_API_KEY"] = os.getenv("OPENWEATHERMAP_API_KEY", "")
weather_tools = load_tools(["openweathermap-api"], llm=llm)
weather_tool = weather_tools[0] if weather_tools else None

# ======================================================
# ✅ Build Agent
# ======================================================
react_prompt = hub.pull("hwchase17/react")

tools = [rag_tool]
if weather_tool:
    tools.append(weather_tool)

agent = create_react_agent(
    tools=tools,
    llm=llm,
    prompt=react_prompt
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True
)

# ======================================================
# ✅ Memory per Session
# ======================================================
session_memories = {}

# ======================================================
# ✅ System Prompt
# ======================================================
SYSTEM_PROMPT = """You are a helpful assistant for NO18 Restaurant.
You answer questions about menu items, prices, categories, and restaurant information.
Always use the internal knowledge base (RAGRetriever) when needed.
"""

# ======================================================
# ✅ Ask Question Function
# ======================================================
def ask_question(question: str, session_id: str = "default") -> str:
    if session_id not in session_memories:
        session_memories[session_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

    memory = session_memories[session_id]

    # Run the agent with system prompt + memory
    full_input = f"{SYSTEM_PROMPT}\n\nUser: {question}"
    result = agent_executor.invoke({"input": full_input})

    answer = result.get("output", "⚠️ No response generated.")
    memory.chat_memory.add_user_message(question)
    memory.chat_memory.add_ai_message(answer)

    return answer

# ======================================================
# ✅ Example Run
# ======================================================
if __name__ == "__main__":
    print(ask_question("Tell me about Mango Smoothie", session_id="u1"))
    print(ask_question("What is the price?", session_id="u1"))
