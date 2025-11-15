1. When testing the service locally, first check if it is already running - do not run multiple instances of the same service.
2. Never write code before writing failing test first - follow GL-TDD (Note: For visual prototype phase - Phase 0, visual verification replaces automated tests per GL-TDD.md. Automated tests required for production phases.)
3. Follow GL-RDD for detailed guidelines on when to split files based on logical cohesion
4. Follow GL-ERROR-LOGGING for comprehensive error handling and logging standards
5. Maintain clear layer boundaries
6. Always use appropriate agents and run them in parallel (even same name agents) to speed up the work
7. Before building any feature - check PROJECT_ROADMAP.md (look for it if doesn't exist - create it), then create the name and number (ID of the sprint) in the project roadmap in the following way "SP_ID_what is being done.md", for example if the sprint is about PostgreSQL to Supabase migration and it it sprint number 5 in the roadmap, you name it "SP_005_PostgreSQL_to_Supabase_migration". Then create the sprint plan in the 00_IMPLEMENTATION >> SPRINTS folder, and name it in the same way it is listed in the PROJECT_ROADMAP
   - This sprint plan should exactly describe what you are going to implement in plain english and without code. Use charts or illustrations where necessary
   - After creating the SP file, list it in PROGRESS.md (only condensed description of the Sprint needs to be included)
   - After having implemented the SP update the PROGRESS.md, PROJECT_ROADMAP.md, FEATURE_LIST.md and USER_STORIES.md. Use appropriate agent
   - If the work on the sprint will produce more than 1 file - create a "SP_ID_what is being done" folder under SPRINTS folder and put all files there
8. IMPORTANT: ALWAYS USE A DEDICATED SUB AGENT WHEN YOU WANT TO USE MCP, AND THEN FROM SUB AGENT PUSH ONLY RELEVANT INFORMATION TO THE MAIN AGENT
9. IMPORTANT: Do not use Docker until the project is completed and its time to deploy
10. IMPORTANT: Don't push the changes to github unless I told you to in the current message