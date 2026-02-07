const String STORY_TEMPLATE = r'''
[TITLE OF STORY]
[GENRE: Choose Your Own Adventure / Middle Grade Mystery / Sci-Fi / Fantasy]
[TONE: Fun, spooky but safe, engaging, suitable for 8-12 year olds]
[TARGET LENGTH: ~150-200 Pages]

[INSTRUCTIONS FOR WRITER]
1. Structure the story into 4 distinct sections of 50 pages each (1-50, 51-100, 101-150, 151-200).
2. Use the exact header format: "THE [TITLE]: PAGES [START]–[END]" at the start of each section.
3. Each page must start with "Page [X]" on a new line.
4. Narrative text follows "Page [X]". Keep it to 1-2 paragraphs.
5. Choices must be in the format: "If you [action], TURN TO PAGE [number]."
6. Endings must be in the format: "TURN TO PAGE [number] FOR THE '[NAME]' ENDING." followed by the ending text on that page, ending with "THE END: [NAME]."
7. Path Completions: When a major storyline wraps up (usually around page 65, 135, etc.), provide a summary and options to jump to other major branching points.
   Example: "YOU HAVE FINISHED PATH 1. To see what would have happened in [Location B], TURN TO PAGE [X]."
8. Create ~3 major paths:
   - Path 1: The "Mundane/Funny" Path (Validates the skepticism, funny misunderstanding).
   - Path 2: The "Sci-Fi/Conspiracy" Path (Validates the paranoia, mild sci-fi elements).
   - Path 3: The "Supernatural/Weird" Path (Validates the supernatural fears, enters a 'Twilight Zone').


[SECTION 1: THE SETUP & INVESTIGATION]
---------------------------------------------------------
THE [TITLE]: PAGES 1–50

Page 1
[Introduction: Introduce the setting, the protagonist (You), and the sidekicks (The Smart Friend, The Loyal/Funny Friend). Establish the Inciting Incident: A missing person, a strange object, or a mystery.]
[The Call to Adventure: The bell rings/school ends. The group must decide on a course of action.]

Page 2
[The first steps. Gathering clues. Highlighting the different theories of the sidekicks (one thinks it's aliens, one thinks it's a misunderstanding).]

[... Pages 3-4: Build tension and clues ...]

Page 5
[THE FIRST MAJOR CHOICE POINTER]
You have three leads. Which path do you take?
If you decide to [Option A: Mundane Location/House], TURN TO PAGE 16.
If you decide to [Option B: Sci-Fi/Industrial Location/Basement], TURN TO PAGE 75.
If you decide to [Option C: Supernatural Location/Woods], TURN TO PAGE 140.

[SUB-SECTION: PATH A - THE MUNDANE MYSTERY (Pages 6-49)]
[In this path, the "scary" elements turn out to be ordinary things seen through a fearful lens. E.g., The "monster" is a dog, the "blood" is soup.]

Page 16
[Arriving at Location A...]

[... Pages 17-49: The kids investigate, getting into funny scrapes, dodging "bad guys" who are actually just neighbors or delivery drivers.]

[SECTION 2: THE CONFRONTATION & RESOLUTION (PATH A)]
---------------------------------------------------------
THE [TITLE]: PAGES 51–100

Page 50
[The Climax of Path A. The kids get "caught" or find the "truth."]

[... Pages 51-64: Dealing with the fallout. Getting grounded, doing community service, or realizing the truth. Wrap up the emotional arc.]

Page 65
[PATH 1 CONCLUSION]
[Reflect on the journey. The kids are safe and happy.]
YOU HAVE FINISHED PATH 1: THE [NAME] ROUTE.
To see what would have happened in [Location B], TURN TO PAGE 75.
To see what was really in [Location C], TURN TO PAGE 140.

[SECTION 3: PATH B - THE SCI-FI THRILLER (Pages 75-139)]
---------------------------------------------------------
THE [TITLE]: PAGES 51–100 (Continued) / PAGES 101–150

Page 75
[The entry into Location B (Basement/Lab). This path validates the Sci-Fi gears. The school *is* a lab. The teachers *are* robots/aliens.]

[... Pages 76-134: High-stakes action. Avoiding capture. Hacking computers. Saving the "victim".]

Page 135
[PATH 2 CONCLUSION]
THE END: THE [NAME] ENDING.
[The kids save the day, expose the conspiracy, and become heroes.]
YOU HAVE FINISHED PATH 2. To see the supernatural truth of [Location C], TURN TO PAGE 136.

[SECTION 4: PATH C - THE SUPERNATURAL TWIST (Pages 140-200)]
---------------------------------------------------------
THE [TITLE]: PAGES 151–200

Page 136
[Entering Location C (Woods/Attic). The atmosphere shifts. It's not sci-fi or funny anymore; it's dreamlike and strange.]

Page 140
[The reality bends. The "glitch" in the world. Meeting the "Guardian" or "Monster".]

[... Pages 141-199: A journey through a surreal landscape. Dealing with time loops, ghosts, or magical logic.]

Page 200
[The final, most esoteric ending. Accepted ambiguity or a magical return to normalcy.]
THE END: THE [NAME] ENDING.
''';
