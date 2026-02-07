# Copyright (c) 2025 UniSat
#
# Test client for Bitcoin Query Agent

import asyncio
import sys
from pathlib import Path

import httpx


# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


async def test_agent(query: str, base_url: str = "http://localhost:8000"):
    """Send a query to the agent and get response"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        payload = {"query": query}

        response = await client.post(f"{base_url}/chat", json=payload)
        response.raise_for_status()

        return response.json()


async def main():
    """Run test queries"""

    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

    test_queries = [
        "当前比特币区块高度是多少？",
        "查询当前网络手续费",
        "比特币网络的推荐费率是多少？",
        "帮我查一下最新的区块信息",
    ]

    print("Bitcoin Query Agent - 测试客户端")
    print(f"服务器地址: {base_url}")
    print("=" * 60)

    for query in test_queries:
        print(f"\n用户: {query}")
        print("-" * 60)

        try:
            result = await test_agent(query, base_url)

            if "answer" in result:
                print(f"助手: {result['answer']}")
            else:
                print(f"响应: {result}")

        except Exception as e:
            print(f"错误: {e}")

        print()


if __name__ == "__main__":
    asyncio.run(main())
