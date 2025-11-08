#!/usr/bin/env python3
"""
Setup and run script for NewsRec AI recommendation system
"""

import os
import sys
import subprocess

def check_requirements():
    """Check if required packages are installed"""
    try:
        import sklearn
        import pandas
        import numpy
        import requests
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        return False

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False

def setup_environment():
    """Setup environment variables"""
    env_file = ".env"
    env_example = ".env.example"
    
    if not os.path.exists(env_file):
        print("⚠️  .env file not found")
        if os.path.exists(env_example):
            print("📝 Please copy .env.example to .env and add your API key")
            print("   Or set environment variable: NEWS_API_KEY=your_key_here")
        else:
            print("📝 Please create .env file with: NEWS_API_KEY=your_key_here")
        return False
    
    print("✅ Environment file found")
    return True

def run_recommender():
    """Run the recommendation system"""
    print("🚀 Running news recommendation system...")
    try:
        from components.news_recommender import main
        main()
        return True
    except Exception as e:
        print(f"❌ Error running recommender: {e}")
        return False

def main():
    """Main setup and run function"""
    print("🔧 NewsRec AI Setup & Run")
    print("=" * 30)
    
    # Check if requirements are installed
    if not check_requirements():
        print("\n📦 Installing requirements...")
        if not install_requirements():
            print("❌ Setup failed. Please install requirements manually:")
            print("   pip install -r requirements.txt")
            return
    
    # Check environment setup
    if not setup_environment():
        print("❌ Please setup your API key before running")
        return
    
    # Run the recommender
    if run_recommender():
        print("\n🎉 Success! Check public/recommendations.json for results")
        print("💡 Now refresh your React app (Ctrl+R) to see personalized recommendations served from /recommendations.json!")
    else:
        print("❌ Failed to generate recommendations")

if __name__ == "__main__":
    main()
