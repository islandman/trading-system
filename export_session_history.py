#!/usr/bin/env python3
"""
Session History Export Script for Market Simulation Trading System
Exports all available session data to JSON files
"""

import requests
import json
import os
from datetime import datetime
import time

# Configuration
BROKER_URL = "http://localhost:8000"
SIP_URL = "http://localhost:8002"

def export_data():
    """Export all session history data"""
    
    # Create export directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_dir = f"session_export_{timestamp}"
    os.makedirs(export_dir, exist_ok=True)
    
    print(f"📁 Exporting session history to: {export_dir}")
    
    # Export functions
    def export_endpoint(endpoint, filename, base_url=BROKER_URL):
        """Export data from an API endpoint"""
        try:
            url = f"{base_url}{endpoint}"
            print(f"📥 Fetching {url}...")
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                filepath = os.path.join(export_dir, filename)
                
                with open(filepath, 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                
                print(f"✅ Exported {len(data) if isinstance(data, list) else 1} records to {filename}")
                return data
            else:
                print(f"❌ Failed to fetch {endpoint}: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error exporting {endpoint}: {e}")
            return None
    
    # Export all available data
    exports = [
        # Broker data
        ("/trade-journal", "trade_journal.json"),
        ("/trade-journal/analytics", "trade_analytics.json"),
        ("/orders", "orders.json"),
        ("/positions", "positions.json"),
        ("/risk-metrics", "risk_metrics.json"),
        ("/portfolio", "portfolio.json"),
        ("/stats", "system_stats.json"),
        
        # SIP data (market data)
        ("/historical-data/AAPL", "aapl_history.json", SIP_URL),
        ("/historical-data/MSFT", "msft_history.json", SIP_URL),
        ("/historical-data/SPY", "spy_history.json", SIP_URL),
        ("/market-data/AAPL", "aapl_market_data.json", SIP_URL),
        ("/market-data/MSFT", "msft_market_data.json", SIP_URL),
        ("/market-data/SPY", "spy_market_data.json", SIP_URL),
    ]
    
    exported_data = {}
    
    for endpoint, filename, *args in exports:
        base_url = args[0] if args else BROKER_URL
        data = export_endpoint(endpoint, filename, base_url)
        if data:
            exported_data[filename] = data
        time.sleep(0.1)  # Small delay to be nice to the server
    
    # Create summary report
    summary = {
        "export_timestamp": datetime.now().isoformat(),
        "export_directory": export_dir,
        "files_exported": len(exported_data),
        "file_list": list(exported_data.keys()),
        "summary": {}
    }
    
    # Add summary statistics
    if "trade_journal.json" in exported_data:
        trades = exported_data["trade_journal.json"]
        summary["summary"]["total_trades"] = len(trades)
        if trades:
            summary["summary"]["date_range"] = {
                "first_trade": min(t.get("timestamp", 0) for t in trades),
                "last_trade": max(t.get("timestamp", 0) for t in trades)
            }
    
    if "orders.json" in exported_data:
        summary["summary"]["total_orders"] = len(exported_data["orders.json"])
    
    # Save summary
    summary_file = os.path.join(export_dir, "export_summary.json")
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"\n🎉 Export completed!")
    print(f"📊 Summary: {summary_file}")
    print(f"📁 All files saved in: {export_dir}")
    
    return export_dir

if __name__ == "__main__":
    print("🚀 Market Simulation Trading System - Session History Export")
    print("=" * 60)
    
    # Check if services are running
    try:
        health_check = requests.get(f"{BROKER_URL}/health", timeout=5)
        if health_check.status_code == 200:
            print("✅ Broker service is running")
        else:
            print("❌ Broker service is not responding properly")
            exit(1)
    except:
        print("❌ Cannot connect to broker service. Make sure it's running on localhost:8000")
        exit(1)
    
    # Export data
    export_dir = export_data()
    
    print(f"\n📋 Next steps:")
    print(f"1. Review the exported data in: {export_dir}")
    print(f"2. Import into Excel/Google Sheets for analysis")
    print(f"3. Use the JSON files for custom analysis scripts")
    print(f"4. Share the export directory for backup/archiving")
