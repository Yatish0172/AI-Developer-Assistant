import google.generativeai as genai
genai.configure(api_key="YOUR_API_KEY")

for m in genai.list_models():
    print(m.name)
