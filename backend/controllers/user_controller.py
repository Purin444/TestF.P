from zk import ZK
from extensions import mongo

# ฟังก์ชันสำหรับเชื่อมต่อ ZKTeco
def connect_zk():
    zk = ZK('192.168.1.220', port=4370, timeout=5)
    try:
        conn = zk.connect()
        conn.disable_device()
        print("Connected to ZKTeco successfully.")
        return conn
    except Exception as e:
        print(f"Error connecting to ZK device: {e}")
        return None
    

# ฟังก์ชันดึงข้อมูลผู้ใช้งานและบันทึกใน MongoDB
def fetch_users():
    """ ดึงข้อมูล Users จาก ZKTeco และบันทึกลง MongoDB """
    conn = connect_zk()  # เรียกใช้ connect_zk() เพื่อจัดการการเชื่อมต่อ
    if not conn:
        print("Failed to connect to ZKTeco.")
        return {"error": "Unable to connect to ZK device"}, 500

    try:
        # ดึงข้อมูลผู้ใช้จาก ZKTeco
        users = conn.get_users()
        if not users:
            print("No users found on the device.")
            return {"error": "No users found on the device"}, 404

        print(f"Fetched {len(users)} users from ZKTeco.")

        # เตรียมข้อมูลสำหรับบันทึกใน MongoDB
        user_data = [
            {
                'user_id': user.user_id,
                'name': user.name or "Unnamed"
            }
            for user in users
        ]
        print(f"Prepared user data: {user_data}")

        # อัปเดตข้อมูลใน MongoDB
        users_collection = mongo.db.users
        users_collection.delete_many({})  # ลบข้อมูลเก่า
        users_collection.insert_many(user_data)

        # ดึงข้อมูลทั้งหมดจาก MongoDB และแปลง ObjectId เป็น str
        users_from_db = users_collection.find()
        response_data = [
            {
                "_id": str(user["_id"]),
                "user_id": user["user_id"],
                "name": user["name"]
            }
            for user in users_from_db
        ]

        print("Users successfully fetched and serialized.")
        return response_data, 200
    except Exception as e:
        print(f"Error fetching users: {e}")
        return {"error": str(e)}, 500
    finally:
        if conn:
            conn.enable_device()
            conn.disconnect()
            print("Disconnected from ZKTeco.")
