const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testScenario() {
    try {
        console.log('Testing Veni scenario...');
        
        // Create test file
        fs.writeFileSync('test.jpg', 'test');
        
        // Step 1: Create 4 violations for Veni at Door 5
        for (let i = 1; i <= 4; i++) {
            console.log(`Creating violation ${i} for Veni...`);
            
            const form = new FormData();
            form.append('residentName', 'Veni');
            form.append('doorNumber', '5');
            form.append('photo', fs.createReadStream('test.jpg'));
            
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: form
            });
            
            const result = await response.json();
            console.log(`Violation ${i} result:`, result);
        }
        
        // Step 2: Check Veni's status (should have 4 violations and auto fine)
        console.log('\nChecking Veni status...');
        const veniStatus = await fetch('http://localhost:5000/api/resident/5');
        const veniData = await veniStatus.json();
        console.log('Veni status:', veniData);
        
        // Step 3: Veni pays the fine
        console.log('\nVeni paying fine...');
        const payment = await fetch('http://localhost:5000/api/pay/5', { method: 'POST' });
        const paymentResult = await payment.json();
        console.log('Payment result:', paymentResult);
        
        // Step 4: Create violation for Swathi at same door (should be 1st violation)
        console.log('\nCreating violation for Swathi at Door 5...');
        const swathiForm = new FormData();
        swathiForm.append('residentName', 'Swathi');
        swathiForm.append('doorNumber', '5');
        swathiForm.append('photo', fs.createReadStream('test.jpg'));
        
        const swathiResponse = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            body: swathiForm
        });
        
        const swathiResult = await swathiResponse.json();
        console.log('Swathi violation result:', swathiResult);
        
        // Step 5: Check Swathi's status
        console.log('\nChecking Swathi status...');
        const swathiStatus = await fetch('http://localhost:5000/api/resident/5');
        const swathiData = await swathiStatus.json();
        console.log('Swathi status:', swathiData);
        
        // Step 6: Create 5th violation for Veni (should continue her cycle)
        console.log('\nCreating 5th violation for Veni...');
        const veniForm5 = new FormData();
        veniForm5.append('residentName', 'Veni');
        veniForm5.append('doorNumber', '5');
        veniForm5.append('photo', fs.createReadStream('test.jpg'));
        
        const veniResponse5 = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            body: veniForm5
        });
        
        const veniResult5 = await veniResponse5.json();
        console.log('Veni 5th violation result:', veniResult5);
        
        // Step 7: Check final Head Dashboard
        console.log('\nChecking Head Dashboard...');
        const headDashboard = await fetch('http://localhost:5000/api/head');
        const headData = await headDashboard.json();
        console.log('Head Dashboard residents:', headData.residents);
        
        // Cleanup
        fs.unlinkSync('test.jpg');
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testScenario();
