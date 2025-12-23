from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Izinkan akses dari GitHub Pages

# Koneksi ke MongoDB Atlas (dari variabel lingkungan Heroku)
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    raise ValueError("MONGO_URI tidak ditemukan! Atur di Heroku Config Vars.")

client = MongoClient(MONGO_URI)
db = client.chatAppDB  # Nama database yang kita buat di MongoDB
messages_col = db.messages  # Koleksi untuk menyimpan pesan

# Rute 1: Masuk Room
@app.route('/join-room', methods=['POST'])
def join_room():
    data = request.get_json()
    username = data.get('username')
    roomcode = data.get('roomcode')

    # Validasi input
    if not username or len(username) > 20:
        return jsonify({
            'success': False,
            'message': 'Nama harus diisi dan tidak lebih dari 20 karakter!'
        })
    
    if not roomcode or len(roomcode) != 4 or not roomcode.isdigit():
        return jsonify({
            'success': False,
            'message': 'Kode room harus 4 angka!'
        })

    return jsonify({
        'success': True,
        'message': f"Selamat datang, {username}! Masuk room {roomcode}."
    })

# Rute 2: Kirim Pesan
@app.route('/send-message', methods=['POST'])
def send_message():
    data = request.get_json()
    username = data.get('username')
    roomcode = data.get('roomcode')
    message = data.get('message')

    # Validasi input
    if not all([username, roomcode, message]):
        return jsonify({'success': False, 'message': 'Data tidak lengkap!'})
    
    if len(message) > 200:
        return jsonify({'success': False, 'message': 'Pesan terlalu panjang (max 200 karakter)!'})

    # Simpan pesan ke MongoDB
    try:
        messages_col.insert_one({
            'username': username,
            'roomcode': roomcode,
            'message': message,
            'timestamp': datetime.utcnow()  # Waktu UTC agar konsisten
        })
        return jsonify({'success': True, 'message': 'Pesan terkirim!'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Gagal simpan pesan: {str(e)}'})

# Rute 3: Ambil Pesan Lama
@app.route('/get-messages')
def get_messages():
    roomcode = request.args.get('roomcode')

    if not roomcode or len(roomcode) != 4:
        return jsonify({'success': False, 'message': 'Kode room tidak valid!'})

    # Ambil pesan dari database (urutkan dari terlama ke terbaru)
    try:
        messages = list(
            messages_col.find(
                {'roomcode': roomcode},
                {'_id': 0, 'username': 1, 'message': 1, 'timestamp': 1}  # Jangan ambil _id
            ).sort('timestamp', 1)
        )

        # Format waktu agar mudah dibaca
        for msg in messages:
            msg['timestamp'] = msg['timestamp'].strftime('%H:%M:%S')

        return jsonify({
            'success': True,
            'messages': messages,
            'total': len(messages)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Gagal ambil pesan: {str(e)}'})

if __name__ == '__main__':
    # Jalankan server (untuk pengembangan lokal)
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
