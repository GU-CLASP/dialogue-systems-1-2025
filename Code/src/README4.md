# Meeting Booking and "Who is X?" Program  

This program handles two primary intents: **Create Meeting** and **Who is X**.  

## Intents and Flow  

### 1. **Create Meeting Intent**  
The **Create Meeting** intent allows the user to schedule a meeting. The program will recognize the intent even if no entities are initially provided — it will gather the missing details through follow-up questions until all required slots are filled.  

#### **Entities:**  
The following entities are used for the Create Meeting intent:  
- `personName` – The name of the person to meet with.  
- `meetingTime` – The time of the meeting.  
- `meetingDate` – The date of the meeting.  

#### **Flow:**  
- If **only the intent** is identified (e.g., "Book a meeting"), the program will start by asking for the missing entities step-by-step.  
- If **some entities** are provided, the program will continue to ask for the missing ones.  
- The program will **only confirm the meeting** once all required entities (person, time, and date) are filled.  
- If the identified intent is **not Create Meeting**, the program will not attempt to fill the slots.  

#### **Examples:**  
- **Input:** `Book a meeting with Cristina at 10 on Monday`  
   - ✅ All entities (person, time, date) are provided — the program will directly **confirm the meeting**.  

- **Input:** `Book a meeting with Cristina on Monday`  
   - ✅ Person and date are provided — the program will **ask for the duration** and depending on the answer it will either confirm or **ask for time**. 

- **Input:** `Book a meeting with Cristina at 10`  
   - ✅ Person and time are provided — the program will **ask for the date** and confirm once it's filled.  

- **Input:** `Book a meeting`  
   - ✅ No entities are provided — the program will **ask for the person, date, and time** step-by-step until all slots are filled, then confirm.  

---  

### 2. **Who is X Intent**  
The **Who is X** intent retrieves information about known individuals from a **JSON file**. The available individuals include:  
- Mark Elliot Zuckerberg  
- Elon Musk  
- Beyoncé  
- Jeffrey Preston Bezos  

#### **Example:**  
- **Input:** `Who is Mark Zuckerberg?`  
   - ✅ The program will retrieve information about Mark Zuckerberg from the **JSON file** and return it.  
