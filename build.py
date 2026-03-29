import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data" / "lessons"
LESSONS_LIST_PATH = BASE_DIR / "data" / "lessons.json"
TEMPLATES_DIR = BASE_DIR / "templates"
PAGES_DIR = BASE_DIR / "pages"
INDEX_PATH = BASE_DIR / "index.html"

# Templates
LESSON_TEMPLATE_PATH = TEMPLATES_DIR / "lesson.html"
INDEX_TEMPLATE_PATH = TEMPLATES_DIR / "index.html"

def build_lessons():
    print("Building individual lesson pages...")
    if not PAGES_DIR.exists():
        PAGES_DIR.mkdir(parents=True)
    
    template_content = LESSON_TEMPLATE_PATH.read_text(encoding="utf-8")
    
    for json_file in DATA_DIR.glob("*.json"):
        print(f"  Processing {json_file.name}...")
        data = json.loads(json_file.read_text(encoding="utf-8"))
        
        # Inject JSON into template
        output_content = template_content.replace("{{LESSON_DATA_JSON}}", json.dumps(data, ensure_ascii=False))
        
        # Save to pages/
        output_path = PAGES_DIR / f"{json_file.stem}.html"
        output_path.write_text(output_content, encoding="utf-8")
    
    print("Lesson pages built successfully.")

def build_index():
    print("Building index.html...")
    lessons_data = json.loads(LESSONS_LIST_PATH.read_text(encoding="utf-8"))
    lessons = [l for l in lessons_data["lessons"] if l.get("published", True)]
    
    # Sort by date descending
    lessons.sort(key=lambda x: x["date"], reverse=True)
    
    cards_html = []
    for lesson in lessons:
        card = f"""
            <!-- {lesson['date']} Card -->
            <a href="{lesson['path']}" class="group relative block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover-card">
                <div class="h-44 sm:h-48 bg-emerald-50/50 flex items-center justify-center p-6 sm:p-8 group-hover:bg-emerald-50 transition-colors">
                    <div class="text-center">
                        <span class="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full mb-2 uppercase tracking-widest">{lesson['tag']}</span>
                        <h3 class="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-900 transition-colors leading-tight">{lesson['title']}</h3>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                        <span class="flex items-center">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {lesson['date']}
                        </span>
                        <span class="flex items-center text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                            Interactive
                        </span>
                    </div>
                    <p class="text-slate-500 text-sm leading-relaxed mb-5 line-clamp-2">
                        {lesson['summary']}
                    </p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center text-emerald-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                            立即开始
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </div>
                        <div class="flex -space-x-1.5">
                            <div class="w-6 h-6 rounded-full border-2 border-white bg-slate-100"></div>
                            <div class="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
                        </div>
                    </div>
                </div>
            </a>"""
        cards_html.append(card)
    
    template_content = INDEX_TEMPLATE_PATH.read_text(encoding="utf-8")
    output_content = template_content.replace("{{LESSON_CARDS_HTML}}", "\n".join(cards_html))
    
    INDEX_PATH.write_text(output_content, encoding="utf-8")
    print("index.html built successfully.")

if __name__ == "__main__":
    build_lessons()
    build_index()
    print("\nAll done! You can now preview the site.")
