from zk import ZK
from extensions import mongo

# ตั้งค่าเครื่อง ZKTeco
zk = ZK('192.168.1.220', port=4370, timeout=5)

def connect_zk():
    """ เชื่อมต่อ ZKTeco """
    try:
        conn = zk.connect()
        conn.disable_device()
        print("Connected to ZKTeco device")
        return conn
    except Exception as e:
        print(f"Error connecting to ZK device: {e}")
        return None

def fetch_attendance_logs():
    """ ดึงข้อมูล Attendance สดจาก ZKTeco และบันทึกลง MongoDB """
    conn = connect_zk()
    if not conn:
        return {"error": "Unable to connect to ZK device"}, 500

    try:
        # ดึงข้อมูลจาก ZKTeco
        logs = conn.get_attendance()
        attendance_data = [
            {
                'user_id': log.user_id,
                'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'status': log.punch
            }
            for log in logs
        ]

        # บันทึกข้อมูลลง MongoDB
        attendance_collection = mongo.db.attendance
        attendance_collection.delete_many({})
        attendance_collection.insert_many(attendance_data)

        # แปลง ObjectId และดึงข้อมูลคืนจาก MongoDB
        attendance_from_db = attendance_collection.find()
        response_data = [
            {
                "_id": str(att["_id"]),
                "user_id": att["user_id"],
                "timestamp": att["timestamp"],
                "status": att["status"]
            }
            for att in attendance_from_db
        ]
        return response_data, 200
    except Exception as e:
        print(f"Error fetching attendance logs: {e}")
        return {"error": str(e)}, 500
    finally:
        if conn:
            conn.enable_device()
            conn.disconnect()
