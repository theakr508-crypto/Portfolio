import os
import re
import smtplib
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from email.message import EmailMessage
from flask_socketio import SocketIO, emit
import stripe
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}}) # Allow frontend to communicate with backend
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
socketio = SocketIO(app, cors_allowed_origins=os.getenv("ALLOWED_ORIGINS", "*"))

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# --- 1. Messages API ---
@app.route('/api/messages', methods=['POST'])
def messages():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message_body = data.get('message')

    if not all([name, email, message_body]):
        return jsonify({"success": False, "message": "Missing data"}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"success": False, "message": "Invalid email format"}), 400

    # Email configuration from environment variables
    sender_email = os.getenv('EMAIL_SENDER')
    receiver_email = os.getenv('EMAIL_RECEIVER')
    email_password = os.getenv('EMAIL_PASSWORD')
    smtp_server_url = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 465))

    if not all([sender_email, receiver_email, email_password]):
        logger.error("Email configuration is missing in .env file.")
        return jsonify({"success": False, "message": "Server is not configured to send emails."}), 500

    # Create the email message
    msg = EmailMessage()
    msg.set_content(f"You have a new message from your portfolio contact form.\n\nName: {name}\nEmail: {email}\n\nMessage:\n{message_body}")
    msg['Subject'] = f"New Portfolio Message from {name}"
    msg['From'] = f"Portfolio Bot <{sender_email}>"
    msg['To'] = receiver_email

    try:
        with smtplib.SMTP_SSL(smtp_server_url, smtp_port) as smtp_server:
            smtp_server.login(sender_email, email_password)
            smtp_server.send_message(msg)
        
        logger.info(f"Contact form email sent successfully for: {name} ({email})")
        return jsonify({"success": True, "message": "Message sent successfully!"}), 200
    except Exception as e:
        logger.exception("Failed to send email")
        return jsonify({"success": False, "message": "An error occurred on the server while sending the message."}), 500

# --- 2. Payment Gateway (Stripe) ---
@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        amount = data.get('amount')
        
        if not amount or not isinstance(amount, int) or amount <= 0:
            return jsonify({'error': 'Invalid amount provided.'}), 400

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd'
        )
        return jsonify({'clientSecret': intent.client_secret}), 200
    except stripe.error.StripeError as e:
        logger.error(f'Stripe error: {str(e)}')
        return jsonify(error="Payment processing error"), 502
    except Exception as e:
        logger.exception('Unexpected error creating payment intent')
        return jsonify(error="Internal server error"), 500

# --- 3. Projects API (Dynamic Portfolio) ---
@app.route('/api/projects', methods=['GET'])
def get_projects():
    # In a real app, this would be fetched from a database (e.g., PostgreSQL, MongoDB)
    projects = [
        {
            "id": 1,
            "title": "Durgesh Security Services",
            "description": "A live project preview hosted on GitHub Pages with a clickable homepage snapshot.",
            "tags": ["GitHub Pages", "Frontend", "Live Site"],
            "link": "https://theakr508-crypto.github.io/Test/index.html",
            "preview": "https://theakr508-crypto.github.io/Test/index.html"
        },
        {
            "id": 2,
            "title": "Mahima Packers and Movers",
            "description": "A live website preview for a packers and movers business homepage.",
            "tags": ["GitHub Pages", "Website", "Frontend"],
            "link": "https://theakr508-crypto.github.io/test-saket-ji/",
            "preview": "https://theakr508-crypto.github.io/test-saket-ji/"
        }
    ]
    return jsonify({"success": True, "projects": projects}), 200

# --- 4. Real-Time Chatbox (Socket.io) ---
@socketio.on('send_message')
def handle_message(data):
    logger.info(f'Chat message received: {data}')
    emit('receive_message', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    is_debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    logger.info(f"Starting Python Flask server on port {port}...")
    socketio.run(app, host="0.0.0.0", port=port, debug=is_debug, allow_unsafe_werkzeug=True)
