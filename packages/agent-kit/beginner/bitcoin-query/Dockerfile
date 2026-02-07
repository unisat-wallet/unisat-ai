FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY . .

# Expose port
EXPOSE 8000

# Environment variables (can be overridden at runtime)
ENV UNISAT_MCP_URL=http://localhost:3000/mcp

# Run agent
CMD ["python", "agent.py"]
