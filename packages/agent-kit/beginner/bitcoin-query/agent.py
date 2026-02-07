# Copyright (c) 2025 UniSat
#
# UniSat Bitcoin Query Agent - A simple blockchain query agent
# Demonstrates basic Agent + MCP tool integration

import os
import sys

from agentkit.apps import AgentkitAgentServerApp
from google.adk.tools.mcp_tool.mcp_session_manager import (
    StreamableHTTPConnectionParams,
)
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from veadk import Agent, Runner
from veadk.memory.short_term_memory import ShortTermMemory

# Agent configuration
app_name = "bitcoin_query_agent"
user_id = "bitcoin_query_user"

# Get UniSat MCP Server URL from environment
# Default to local development server
UNISAT_MCP_URL = os.getenv(
    "UNISAT_MCP_URL",
    "http://localhost:3000/mcp"
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

# Agent instruction
BITCOIN_QUERY_AGENT_INSTRUCTION = """
你是一个比特币区块链查询助手，专门帮助用户查询比特币网络的相关信息。

## 你可以执行的操作

1. **区块信息查询**
   - 查询当前最新区块高度
   - 查询特定区块的详细信息（区块哈希、时间、交易数量等）

2. **网络状态查询**
   - 查询当前网络推荐手续费
   - 查询网络拥堵情况

3. **地址查询**
   - 查询比特币地址余额
   - 查询地址的 UTXO 列表
   - 查询地址的交易历史

4. **交易查询**
   - 查询交易详情
   - 查询交易状态

5. **BRC20 代币查询**
   - 查询 BRC20 代币信息
   - 查询地址的 BRC20 代币余额

6. **Runes 查询**
   - 查询 Runes 代币信息
   - 查询地址的 Runes 余额

7. **铭文查询**
   - 查询 Ordinal 铭文信息

## 回答规范

1. **使用中文回复**，确保表达清晰、专业
2. **数据准确性优先**：直接使用工具返回的数据，不要编造
3. **友好引导**：如果用户问题不明确，主动询问细节
4. **格式化展示**：使用表格或列表展示结构化数据
5. **提供上下文**：解释数据的含义，帮助用户理解

## 注意事项

- 如果工具调用失败，如实告知用户可能的原因
- 对于不支持的查询类型，明确告知用户当前的限制
- 保护用户隐私，不要在日志中暴露完整地址

""" + ("" if has_mcp else "\n\n**注意：当前未连接到 UniSat MCP Server，工具功能不可用。请设置 UNISAT_MCP_URL 环境变量后重启。**")

# Create the agent
bitcoin_query_agent = Agent(
    name="bitcoin_query_agent",
    description="比特币区块链查询助手，可以查询区块、交易、地址、BRC20、Runes 等信息",
    instruction=BITCOIN_QUERY_AGENT_INSTRUCTION,
    tools=tools,
)

# Configure short-term memory
short_term_memory = ShortTermMemory(backend="local")

# Create runner for testing
runner = Runner(
    agent=bitcoin_query_agent,
    short_term_memory=short_term_memory,
    app_name=app_name,
    user_id=user_id,
)

# Set root agent for AgentKit platform
root_agent = bitcoin_query_agent

# Create AgentKit server app
agent_server_app = AgentkitAgentServerApp(
    agent=bitcoin_query_agent,
    short_term_memory=short_term_memory,
)


async def main():
    """Test the agent with sample queries"""
    session_id = "test_session"

    test_queries = [
        "当前比特币区块高度是多少？",
        "查询当前网络手续费",
        "帮我查询一下比特币网络的状态",
    ]

    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"用户: {query}")
        print(f"{'='*60}")
        response = await runner.run(messages=query, session_id=session_id)
        print(f"助手: {response}")


if __name__ == "__main__":
    import asyncio

    # Run test when executed directly
    print("Bitcoin Query Agent - 比特币查询助手")
    print(f"MCP Server URL: {UNISAT_MCP_URL}")
    print(f"MCP Connected: {has_mcp}")
    print("-" * 60)

    # Uncomment to run test
    # asyncio.run(main())

    # Start AgentKit server
    print("Starting AgentKit server on http://0.0.0.0:8000")
    agent_server_app.run(host="0.0.0.0", port=8000)
