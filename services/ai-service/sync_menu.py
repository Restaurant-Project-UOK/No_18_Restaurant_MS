import requests
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MENU_SERVICE_URL = os.getenv("MENU_SERVICE_URL", "https://gateway-app.mangofield-91faac5e.southeastasia.azurecontainerapps.io/api/menu?restaurantId=1")

def sync_menu_data():
    """Fetches menu data from menu-service and updates AI service MongoDB."""
    print("Starting menu synchronization...")
    try:
        # 1. Fetch from Menu Service
        response = requests.get(MENU_SERVICE_URL)
        response.raise_for_status()
        menu_items = response.json()
        
        if not menu_items:
            print("No menu items received from menu-service.")
            return False

        # 2. Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client["restaurant_db"]
        collection = db["menu_items"]

        # 3. Upsert data
        for item in menu_items:
            item_id = item.get("id")
            name = item.get("name")
            
            # Prepare data for MongoDB
            # We can also pre-process categories for easier RAG if desired
            categories = item.get("categories", [])
            category_names = [c.get("name") for c in categories if c.get("name")]
            item["category_list"] = ", ".join(category_names)
            
            collection.update_one(
                {"id": item_id},
                {"$set": item},
                upsert=True
            )
            print(f"Synced: {name} (ID: {item_id})")
        
        print(f"Successfully synced {len(menu_items)} items to MongoDB.")
        return True

    except Exception as e:
        print(f"Error during synchronization: {e}")
        return False

if __name__ == "__main__":
    sync_menu_data()
