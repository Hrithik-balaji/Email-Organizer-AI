let currentData = [];

document.getElementById('analyzeBtn').addEventListener('click', loadEmails);
document.getElementById('resetBtn').addEventListener('click', resetView);
document.getElementById('sortSelect').addEventListener('change', sortEmails);

async function loadEmails() {
    const list = document.getElementById('emailList');
    list.innerHTML = `<div class="text-center py-10 text-blue-400 animate-pulse">Running AI Priority Engine...</div>`;

    try {
        // Fetch data from FastAPI backend
        // Ensure this matches your backend URL exactly
        const response = await fetch('http://127.0.0.1:8001/analyze');
        
        if (!response.ok) throw new Error("Backend connection failed");

        currentData = await response.json();
        
        renderEmails(currentData);
        updateStats(currentData);
    } catch (error) {
        console.error(error);
        list.innerHTML = `<div class="text-center text-red-400 py-10 bg-slate-800 rounded border border-red-500/50">
                            <p class="font-bold">Error connecting to AI Backend.</p>
                            <p class="text-sm">Make sure 'uvicorn' is running in the terminal.</p>
                          </div>`;
    }
}

function renderEmails(emails) {
    const list = document.getElementById('emailList');
    list.innerHTML = '';
    
    if (emails.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-slate-500">Inbox is empty. Great job! 🎉</div>`;
        return;
    }

    emails.forEach((email, index) => {
        // Define styles based on priority
        let borderClass = email.priority === 'High' ? 'border-red-500' : 
                          email.priority === 'Medium' ? 'border-yellow-500' : 'border-green-500';
        
        let badgeColor = email.priority === 'High' ? 'bg-red-500/20 text-red-300' : 
                         email.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300';
        
        // Add pulse effect only for high priority
        let pulseClass = email.priority === 'High' ? 'pulse-high' : '';

        const card = `
            <div class="group relative bg-slate-800 rounded-lg p-5 border-l-4 ${borderClass} shadow-lg hover:bg-slate-750 transition-all slide-in" style="animation-delay: ${index * 100}ms">
                
                <button onclick="deleteEmail(${email.id})" class="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>

                <div class="flex justify-between items-start mb-2 pr-8">
                    <div class="flex items-center gap-3">
                        <span class="${badgeColor} ${pulseClass} text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            ${email.priority}
                        </span>
                        <span class="text-slate-500 text-xs font-mono">Score: ${email.score}/100</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-baseline">
                    <h3 class="text-lg font-bold text-white mb-1">${email.subject}</h3>
                    <span class="text-xs text-slate-500">${email.sender}</span>
                </div>
                
                <p class="text-slate-400 text-sm mb-4 line-clamp-2">"${email.body}"</p>
                
                <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <span class="text-xs text-slate-500 mr-1 self-center">AI Reasoning:</span>
                    ${email.reasons.map(r => `<span class="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-600">${r}</span>`).join('')}
                </div>
            </div>
        `;
        list.innerHTML += card;
    });
}

// Function to delete a specific email from the view
window.deleteEmail = function(id) {
    // 1. Filter out the deleted email
    currentData = currentData.filter(email => email.id !== id);
    
    // 2. Re-render the list and stats
    renderEmails(currentData);
    updateStats(currentData);
};

// Function to clear everything
function resetView() {
    currentData = [];
    document.getElementById('emailList').innerHTML = `
        <div class="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <p class="text-lg">Inbox is waiting for analysis.</p>
            <p class="text-sm">Click the blue button to start.</p>
        </div>
    `;
    // Reset Stats to 0
    document.getElementById('countHigh').innerText = '0';
    document.getElementById('countMed').innerText = '0';
    document.getElementById('countLow').innerText = '0';
    document.getElementById('barHigh').style.width = '0%';
    document.getElementById('barMed').style.width = '0%';
    document.getElementById('barLow').style.width = '0%';
}

function updateStats(emails) {
    const high = emails.filter(e => e.priority === 'High').length;
    const med = emails.filter(e => e.priority === 'Medium').length;
    const low = emails.filter(e => e.priority === 'Low').length;
    const total = emails.length === 0 ? 1 : emails.length; // Prevent division by zero

    document.getElementById('countHigh').innerText = high;
    document.getElementById('countMed').innerText = med;
    document.getElementById('countLow').innerText = low;

    document.getElementById('barHigh').style.width = `${(high/total)*100}%`;
    document.getElementById('barMed').style.width = `${(med/total)*100}%`;
    document.getElementById('barLow').style.width = `${(low/total)*100}%`;
}

function sortEmails() {
    const criteria = document.getElementById('sortSelect').value;
    let sorted = [...currentData];

    if (criteria === 'score') {
        sorted.sort((a, b) => b.score - a.score);
    } else if (criteria === 'sender') {
        sorted.sort((a, b) => a.sender.localeCompare(b.sender));
    }

    renderEmails(sorted);
}