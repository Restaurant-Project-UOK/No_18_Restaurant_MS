import os
from pymongo import MongoClient
from dotenv import load_dotenv

# LangChain Core and OpenAI Imports
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.tools import Tool
from langchain import hub
try:
    from langchain.agents import AgentExecutor, create_react_agent
except ImportError:
    from langchain.agents import AgentExecutor
    from langchain.agents.react.base import create_react_agent
from langchain.memory import ConversationBufferMemory
from langchain_community.agent_toolkits.load_tools import load_tools
from sync_menu import sync_menu_data

# Load Environment Variables
load_dotenv()

# Configuration for Azure OpenAI
AZURE_API_KEY = os.getenv("AZURE_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")
AZURE_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_EMBEDDING_DEPLOYMENT")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION") or os.getenv("AZURE_API_VERSION_1")
MONGO_URI = os.getenv("MONGO_URI")

# Validation of required variables for Azure Deployment
def check_environment():
    required_vars = [AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT, AZURE_API_VERSION, MONGO_URI]
    if not all(required_vars):
        print("Warning: Missing required Environment Variables. Some features may not work.")
        return False
    return True

env_ready = check_environment()

# Initialize Azure OpenAI Chat Model
llm = AzureChatOpenAI(
    azure_deployment=AZURE_DEPLOYMENT,
    api_key=AZURE_API_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    api_version=AZURE_API_VERSION,
    temperature=0
)

# Initialize Azure OpenAI Embeddings
embeddings = None
if env_ready:
    embeddings = AzureOpenAIEmbeddings(
        azure_deployment=AZURE_EMBEDDING_DEPLOYMENT or "text-embedding-3-large",
        azure_endpoint=AZURE_ENDPOINT,
        api_key=AZURE_API_KEY,
        api_version=AZURE_API_VERSION,
    )

# MongoDB Connection Setup
client = None
db = None
collection = None

if MONGO_URI:
    client = MongoClient(MONGO_URI)
    db = client["restaurant_db"]
    collection = db["menu_items"]
else:
    print("Warning: MONGO_URI not set.")

def load_mongo_documents():
    """Fetches menu data from MongoDB and converts to LangChain Documents."""
    rows = list(collection.find())
    docs = []
    for row in rows:
        name = row.get("name", "Unknown Item")
        description = row.get("description") or "No description available."
        price = row.get("price", "Price not specified")
        category = row.get("category_list") or row.get("category") or "General"

        text = f"Name: {name}\nDescription: {description}\nPrice: {price}\nCategory: {category}"
        
        # Filter metadata for Chroma compatibility (primitives only)
        metadata = {
            k: v for k, v in row.items() 
            if isinstance(v, (str, int, float, bool)) and k != "_id"
        }
        docs.append(Document(page_content=text, metadata=metadata))
    return docs

vectorstore = None
retriever = None

def initialize_vectorstore():
    """Initializes Chroma vector store using the /tmp directory for Azure compatibility."""
    global vectorstore, retriever
    docs = load_mongo_documents()
    if not docs:
        return None
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
    chunks = splitter.split_documents(docs)

    # Use /tmp/chroma_db because the root directory in Azure Container Apps is often read-only
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="/tmp/chroma_db"
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    return vectorstore

# Note: Vector store is now initialized via main.py startup_event to prevent blocks

def reload_vector_store():
    """Manually trigger a refresh of the knowledge base."""
    return initialize_vectorstore()

# Define the RAG Retrieval Tool
def rag_tool_func(query: str) -> str:
    if not retriever:
        return "The knowledge base is currently unavailable."
    results = retriever.invoke(query) 
    return "\n\n".join([doc.page_content for doc in results])

rag_tool = Tool(
    name="RAGRetriever",
    func=rag_tool_func,
    description="Searches the internal menu knowledge base for restaurant items and prices."
)

# Weather Tool Configuration
weather_api_key = os.getenv("OPENWEATHERMAP_API_KEY")
weather_tool = None
if weather_api_key:
    os.environ["OPENWEATHERMAP_API_KEY"] = weather_api_key
    try:
        weather_tools = load_tools(["openweathermap-api"], llm=llm)
        weather_tool = weather_tools[0] if weather_tools else None
    except Exception as e:
        print(f"Warning: Weather tool failed to load: {e}")

# Construct the Agent
react_prompt = hub.pull("hwchase17/react")
tools = [rag_tool]
if weather_tool:
    tools.append(weather_tool)

agent = create_react_agent(tools=tools, llm=llm, prompt=react_prompt)
agent_executor = AgentExecutor(
    agent=agent, 
    tools=tools, 
    verbose=True, 
    handle_parsing_errors=True,
    max_iterations=25,
    max_execution_time=60,
    early_stopping_method="generate"
)

# In-memory session management
session_memories = {}

SYSTEM_PROMPT = "You are a helpful assistant for NO18 Restaurant in Kelaniya. Answer menu and price queries using the RAGRetriever.allways use whether details to suggest menu items. opening times are 10am-10pm daily. The restaurant is located in Kelaniya, Sri Lanka."

def ask_question(question: str, session_id: str = "default") -> str:
    """Processes user questions through the agent with memory support."""
    if session_id not in session_memories:
        session_memories[session_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

    memory = session_memories[session_id]
    full_input = f"{SYSTEM_PROMPT}\n\nUser: {question}"
    
    result = agent_executor.invoke({"input": full_input})
    answer = result.get("output", "I'm sorry, I couldn't generate a response.")
    
    memory.chat_memory.add_user_message(question)
    memory.chat_memory.add_ai_message(answer)
    return answer

if __name__ == "__main__":
    # Local Testing
    print(ask_question("What is on the menu?"))