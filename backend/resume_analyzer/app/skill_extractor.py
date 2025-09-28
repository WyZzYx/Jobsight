# Lightweight rule-based extractor (keeps infra free).
# You can later swap in spaCy NER or a HuggingFace model if needed.

TECH_SKILLS = {
    "java","spring","spring boot","hibernate","jakarta ee","maven","gradle","junit",
    "python","fastapi","django","flask",
    "c#","dotnet",".net","asp.net","entity framework",
    "javascript","typescript","node.js","react","next.js","vue","angular",
    "docker","kubernetes","helm","terraform","ansible",
    "aws","gcp","azure",
    "postgresql","mysql","mariadb","mongodb","redis","kafka","rabbitmq","elasticsearch",
    "git","github","gitlab","ci/cd","jenkins","github actions","gitlab ci",
    "rest","graphql","grpc",
    "linux","bash","powershell",
    "pytest","selenium","cypress","playwright"
}

def normalize(text: str) -> str:
    return text.lower()

def extract_skills(text: str, language: str = "en"):
    t = normalize(text)
    found = set()
    # exact phrase matches
    for k in TECH_SKILLS:
        if k in t:
            found.add(k)
    # heuristics for variants (e.g., "PostgreSQL 15" etc.)
    if "postgre" in t or "postgres" in t:
        found.add("postgresql")
    if "react.js" in t:
        found.add("react")
    if "nodejs" in t or "node js" in t:
        found.add("node.js")
    if ".net" in t or "dotnet" in t:
        found.add(".net")
    return list(found)
