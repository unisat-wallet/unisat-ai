# Copyright (c) 2025 UniSat
#
# Test client for BRC20 Token Analyst

import asyncio
import sys
from pathlib import Path

import httpx


async def test_agent(query: str, base_url: str = "http://localhost:8000"):
    """Send a query to the agent and get response"""

    async with httpx.AsyncClient(timeout=120.0) as client:
        payload = {"query": query}

        response = await client.post(f"{base_url}/chat", json=payload)
        response.raise_for_status()

        return response.json()


async def main():
    """Run test queries"""

    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

    test_queries = [
        "分析一下 ORDI 代币的情况",
        "对比 ORDI 和 SATS 的市场表现",
        "查询 ORDI 的前10大持有人",
        "评估一下 RAT 代币的风险",
    ]

    print("BRC20 Token Analyst - 测试客户端")
    print(f"服务器地址: {base_url}")
    print("=" * 60)

    for query in test_queries:
        print(f"\n用户: {query}")
        print("-" * 60)

        try:
            result = await test_agent(query, base_url)

            if "answer" in result:
                print(f"分析师: {result['answer']}")
            else:
                print(f"响应: {result}")

        except Exception as e:
            print(f"错误: {e}")

        print()


if __name__ == "__main__":
    asyncio.run(main())
