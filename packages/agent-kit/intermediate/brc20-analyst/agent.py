# Copyright (c) 2025 UniSat
#
# BRC20 Token Analyst - A professional BRC20 token analysis agent
# Demonstrates KnowledgeBase + MCP tools + complex reasoning

import os
import sys
from pathlib import Path

from agentkit.apps import AgentkitAgentServerApp
from google.adk.tools.mcp_tool.mcp_session_manager import (
    StreamableHTTPConnectionParams,
)
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from veadk import Agent
from veadk.knowledgebase.knowledgebase import KnowledgeBase
from veadk.memory.short_term_memory import ShortTermMemory

# Add current directory to path for prompts import
sys.path.insert(0, str(Path(__file__).resolve().parent))

from prompts.analyst_prompt import BRC20_ANALYST_INSTRUCTION

# Agent configuration
app_name = "brc20_analyst_agent"

# Get UniSat MCP Server URL from environment
UNISAT_MCP_URL = os.getenv(
    "UNISAT_MCP_URL",
    "http://localhost:3000/mcp"
)

# Knowledge base configuration
KNOWLEDGE_BASE_PATH = os.getenv(
    "BRC20_KB_PATH",
    str(Path(__file__).resolve().parent / "knowledgebase_docs")
)

# Initialize MCP Toolset for UniSat
try:
    unisat_mcp_tool = MCPToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=UNISAT_MCP_URL,
            timeout=30,
        ),
    )
    tools = [unisat_mcp_tool]
    has_mcp = True
except Exception as e:
    print(f"Warning: Failed to connect to UniSat MCP Server: {e}")
    print(f"Please ensure the MCP server is running at {UNISAT_MCP_URL}")
    tools = []
    has_mcp = False

# Initialize Knowledge Base
knowledge = None
if os.path.exists(KNOWLEDGE_BASE_PATH):
    try:
        knowledge = KnowledgeBase(backend="local")
        success = knowledge.add_from_directory(KNOWLEDGE_BASE_PATH)
        if success:
            print(f"Knowledge base loaded from: {KNOWLEDGE_BASE_PATH}")
        else:
            print("Warning: Failed to load knowledge base")
    except Exception as e:
        print(f"Warning: Knowledge base initialization failed: {e}")
else:
    print(f"Info: Knowledge base directory not found at {KNOWLEDGE_BASE_PATH}")

# Create the agent with instruction
brc20_analyst_instruction = BRC20_ANALYST_INSTRUCTION

if not has_mcp:
    brc20_analyst_instruction += "\n\n**注意：当前未连接到 UniSat MCP Server，工具功能不可用。请设置 UNISAT_MCP_URL 环境变量后重启。**"

brc20_analyst_agent = Agent(
    name="brc20_analyst",
    description="BRC20 代币分析师，专业分析比特币生态中的 BRC20 代币数据",
    instruction=brc20_analyst_instruction,
    tools=tools,
    knowledgebase=knowledge,
)

# Configure short-term memory
short_term_memory = ShortTermMemory(backend="local")

# Set root agent for AgentKit platform
root_agent = brc20_analyst_agent

# Create AgentKit server app
agent_server_app = AgentkitAgentServerApp(
    agent=brc20_analyst_agent,
    short_term_memory=short_term_memory,
)


if __name__ == "__main__":
    import asyncio

    print("=" * 60)
    print("BRC20 Token Analyst - BRC20 代币分析师")
    print("=" * 60)
    print(f"MCP Server URL: {UNISAT_MCP_URL}")
    print(f"MCP Connected: {has_mcp}")
    print(f"Knowledge Base: {KNOWLEDGE_BASE_PATH}")
    print(f"Knowledge Base Loaded: {knowledge is not None}")
    print("=" * 60)
    print("\nStarting AgentKit server on http://0.0.0.0:8000")
    print("\n示例查询:")
    print("  - 分析一下 ORDI 代币")
    print("  - 对比 ORDI 和 SATS 的市场表现")
    print("  - 查询 ORDI 的前10大持有人")
    print("  - 评估某个 BRC20 代币的风险")
    print("=" * 60)

    agent_server_app.run(host="0.0.0.0", port=8000)
