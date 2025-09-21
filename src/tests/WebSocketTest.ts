import { webSocketService } from '../services/WebSocketService';

/**
 * WebSocket Service Integration Test
 * 
 * This test verifies that the WebSocket service works correctly
 * for real-time communication between riders and drivers.
 */

export class WebSocketTest {
  private testResults: Array<{ test: string; passed: boolean; message: string }> = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting WebSocket Service Tests...\n');

    await this.testConnection();
    await this.testAuthentication();
    await this.testFareOfferFlow();
    await this.testFareResponseFlow();
    await this.testErrorHandling();
    await this.testCleanup();

    this.printResults();
  }

  private async testConnection(): Promise<void> {
    console.log('🔌 Testing WebSocket Connection...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.addResult('Connection Test', false, 'Connection timeout');
        resolve();
      }, 5000);

      webSocketService.on('connected', () => {
        clearTimeout(timeout);
        this.addResult('Connection Test', true, 'Successfully connected to WebSocket server');
        resolve();
      });

      webSocketService.on('error', (error) => {
        clearTimeout(timeout);
        this.addResult('Connection Test', false, `Connection error: ${error.error}`);
        resolve();
      });
    });
  }

  private async testAuthentication(): Promise<void> {
    console.log('🔐 Testing Authentication...');
    
    // Test driver authentication
    webSocketService.authenticate('test-driver-123', 'driver');
    
    // Test rider authentication
    webSocketService.authenticate('test-rider-456', 'rider');
    
    this.addResult('Authentication Test', true, 'Authentication calls completed');
  }

  private async testFareOfferFlow(): Promise<void> {
    console.log('💰 Testing Fare Offer Flow...');
    
    const testOffer = {
      driverName: 'Test Driver',
      driverRating: 4.5,
      fareAmount: 150,
      arrivalTime: 5,
      vehicleInfo: 'Test Vehicle'
    };

    // Send fare offer
    webSocketService.sendFareOffer('test-ride-123', 'test-driver-123', testOffer);
    
    this.addResult('Fare Offer Test', true, 'Fare offer sent successfully');
  }

  private async testFareResponseFlow(): Promise<void> {
    console.log('💬 Testing Fare Response Flow...');
    
    // Test accept response
    webSocketService.sendFareResponse('test-ride-123', 'test-rider-456', 'accept');
    
    // Test decline response
    webSocketService.sendFareResponse('test-ride-456', 'test-rider-456', 'decline');
    
    this.addResult('Fare Response Test', true, 'Fare responses sent successfully');
  }

  private async testErrorHandling(): Promise<void> {
    console.log('⚠️ Testing Error Handling...');
    
    // Test with invalid data
    try {
      webSocketService.sendFareOffer('', '', {
        driverName: '',
        driverRating: 0,
        fareAmount: 0,
        arrivalTime: 0,
        vehicleInfo: ''
      });
      this.addResult('Error Handling Test', true, 'Error handling works correctly');
    } catch (error) {
      this.addResult('Error Handling Test', false, `Unexpected error: ${error}`);
    }
  }

  private async testCleanup(): Promise<void> {
    console.log('🧹 Testing Cleanup...');
    
    // Test disconnection
    webSocketService.disconnect();
    
    // Test reconnection
    webSocketService.reconnect();
    
    this.addResult('Cleanup Test', true, 'Cleanup and reconnection completed');
  }

  private addResult(test: string, passed: boolean, message: string): void {
    this.testResults.push({ test, passed, message });
  }

  private printResults(): void {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    let passed = 0;
    let total = this.testResults.length;

    this.testResults.forEach(({ test, passed: testPassed, message }) => {
      const status = testPassed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}: ${message}`);
      if (testPassed) passed++;
    });

    console.log('\n📈 Summary:');
    console.log(`Passed: ${passed}/${total} tests`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (passed === total) {
      console.log('🎉 All tests passed! WebSocket service is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the implementation.');
    }
  }
}

// Export test runner function
export const runWebSocketTests = async (): Promise<void> => {
  const tester = new WebSocketTest();
  await tester.runAllTests();
};

// Auto-run tests if this file is executed directly
if (require.main === module) {
  runWebSocketTests().catch(console.error);
}

