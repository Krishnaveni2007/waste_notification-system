const API_BASE = 'http://localhost:5000/api';

async function testResidentAPI() {
    console.log('Testing Resident API...');
    
    try {
        // Test Veni
        console.log('\n=== Testing Veni (Door 5) ===');
        const veniResponse = await fetch(`${API_BASE}/resident/5/Veni`);
        console.log('Veni Response Status:', veniResponse.status);
        const veniData = await veniResponse.json();
        console.log('Veni Data:', JSON.stringify(veniData, null, 2));
        
        // Test Swathi
        console.log('\n=== Testing Swathi (Door 5) ===');
        const swathiResponse = await fetch(`${API_BASE}/resident/5/Swathi`);
        console.log('Swathi Response Status:', swathiResponse.status);
        const swathiData = await swathiResponse.json();
        console.log('Swathi Data:', JSON.stringify(swathiData, null, 2));
        
        // Test Head Dashboard
        console.log('\n=== Testing Head Dashboard ===');
        const headResponse = await fetch(`${API_BASE}/head`);
        console.log('Head Response Status:', headResponse.status);
        const headData = await headResponse.json();
        console.log('Head Data:', JSON.stringify(headData, null, 2));
        
    } catch (error) {
        console.error('Test Error:', error);
    }
}

testResidentAPI();
