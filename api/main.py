from mangum import Mangum
from apps.api.main import app

# Vercel serverless function handler
handler = Mangum(app)