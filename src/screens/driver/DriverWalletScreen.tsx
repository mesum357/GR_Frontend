import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Card, Button, Avatar, ActivityIndicator, Chip, Portal, Dialog, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authenticatedApiRequest } from '../../config/api';

const { width } = Dimensions.get('window');

interface WalletTransaction {
  _id: string;
  transactionType: 'cash_in' | 'cash_out' | 'ride_deduction' | 'refund';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentMethod?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

interface WalletData {
  balance: number;
  currency: string;
  minimumBalance: number;
  canAcceptRides: boolean;
  lastTransactionAt?: string;
  recentTransactions: WalletTransaction[];
}

interface PaymentDetails {
  paymentMethod: string;
  details: {
    accountNumber: string;
    accountHolder: string;
    instructions: string;
  };
  minimumAmount: number;
  maximumAmount: number;
  instructions: string[];
}

const DriverWalletScreen: React.FC = () => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Cash In Modal States
  const [showCashInModal, setShowCashInModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [cashInAmount, setCashInAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmittingCashIn, setIsSubmittingCashIn] = useState(false);
  
  // Cash Out Modal States
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [cashOutAccount, setCashOutAccount] = useState('');
  const [cashOutHolder, setCashOutHolder] = useState('');
  const [isSubmittingCashOut, setIsSubmittingCashOut] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await authenticatedApiRequest('/api/driver/wallet/balance');
      setWalletData(data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaymentDetails = async () => {
    if (!token) return;

    try {
      const data = await authenticatedApiRequest('/api/driver/wallet/payment-details');
      setPaymentDetails(data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      Alert.alert('Error', 'Failed to load payment details. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const handleCashIn = async () => {
    setShowCashInModal(true);
    if (!paymentDetails) {
      await fetchPaymentDetails();
    }
  };

  const submitCashIn = async () => {
    if (!cashInAmount || !transactionId) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const amount = parseFloat(cashInAmount);
    if (amount < 100) {
      Alert.alert('Error', 'Minimum cash in amount is 100 PKR.');
      return;
    }

    if (amount > 50000) {
      Alert.alert('Error', 'Maximum cash in amount is 50,000 PKR.');
      return;
    }

    try {
      setIsSubmittingCashIn(true);
      await authenticatedApiRequest('/api/driver/wallet/cash-in', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          transactionId: transactionId,
          paymentMethod: 'easypaisa'
        })
      });

      Alert.alert(
        'Success',
        'Cash in request submitted successfully. Your request will be processed within 24 hours.',
        [{ text: 'OK', onPress: () => {
          setShowCashInModal(false);
          setCashInAmount('');
          setTransactionId('');
          fetchWalletData();
        }}]
      );
    } catch (error: any) {
      console.error('Error submitting cash in:', error);
      Alert.alert('Error', error.message || 'Failed to submit cash in request. Please try again.');
    } finally {
      setIsSubmittingCashIn(false);
    }
  };

  const handleCashOut = () => {
    if (!walletData) return;

    if (walletData.balance < 100) {
      Alert.alert('Error', 'Minimum cash out amount is 100 PKR.');
      return;
    }

    if (walletData.balance - 100 < walletData.minimumBalance) {
      Alert.alert(
        'Cannot Cash Out',
        `You must maintain a minimum balance of ${walletData.minimumBalance} PKR to accept rides.`
      );
      return;
    }

    setShowCashOutModal(true);
  };

  const submitCashOut = async () => {
    if (!cashOutAmount || !cashOutAccount || !cashOutHolder) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const amount = parseFloat(cashOutAmount);
    if (amount < 100) {
      Alert.alert('Error', 'Minimum cash out amount is 100 PKR.');
      return;
    }

    if (!walletData || amount > walletData.balance) {
      Alert.alert('Error', 'Insufficient balance.');
      return;
    }

    if (walletData.balance - amount < walletData.minimumBalance) {
      Alert.alert(
        'Error',
        `Cannot cash out. You must maintain a minimum balance of ${walletData.minimumBalance} PKR.`
      );
      return;
    }

    try {
      setIsSubmittingCashOut(true);
      await authenticatedApiRequest('/api/driver/wallet/cash-out', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          paymentMethod: 'easypaisa',
          accountNumber: cashOutAccount,
          accountHolder: cashOutHolder
        })
      });

      Alert.alert(
        'Success',
        'Cash out request submitted successfully. Your request will be processed within 24 hours.',
        [{ text: 'OK', onPress: () => {
          setShowCashOutModal(false);
          setCashOutAmount('');
          setCashOutAccount('');
          setCashOutHolder('');
          fetchWalletData();
        }}]
      );
    } catch (error: any) {
      console.error('Error submitting cash out:', error);
      Alert.alert('Error', error.message || 'Failed to submit cash out request. Please try again.');
    } finally {
      setIsSubmittingCashOut(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'cash_in':
        return 'add-circle';
      case 'cash_out':
        return 'remove-circle';
      case 'ride_deduction':
        return 'car';
      case 'refund':
        return 'refresh';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'cash_in':
        return '#4CAF50';
      case 'cash_out':
        return '#FF5722';
      case 'ride_deduction':
        return '#FF9800';
      case 'refund':
        return '#2196F3';
      default:
        return theme.colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'cash_in' || type === 'refund' ? '+' : '-';
    return `${sign}${amount.toFixed(0)} PKR`;
  };

  const filteredTransactions = walletData?.recentTransactions.filter(transaction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return transaction.status === 'pending';
    if (activeTab === 'completed') return transaction.status === 'completed' || transaction.status === 'approved';
    return true;
  }) || [];

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading wallet...
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.profileSection}>
            <Avatar.Text 
              size={64} 
              label={user?.firstName?.[0] || 'D'} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <Text style={[styles.driverName, { color: theme.colors.onSurface }]}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
        </View>

        {/* Balance Card */}
        <Card style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <Card.Content style={styles.balanceContent}>
            <Text style={[styles.balanceLabel, { color: theme.colors.onSurface }]}>
              Wallet Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.onSurface }]}>
              {walletData?.balance.toFixed(0) || '0'} PKR
            </Text>
            
            {/* Minimum Balance Warning */}
            {walletData && walletData.balance < walletData.minimumBalance && (
              <View style={[styles.warningContainer, { backgroundColor: '#FFEB3B20' }]}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={[styles.warningText, { color: '#FF9800' }]}>
                  Minimum {walletData.minimumBalance} PKR required to accept rides
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleCashIn}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
                icon="plus"
              >
                Cash In
              </Button>
              
              <Button
                mode="contained"
                onPress={handleCashOut}
                style={[styles.actionButton, { backgroundColor: '#FF5722' }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
                icon="minus"
                disabled={!walletData || walletData.balance < 100}
              >
                Cash Out
              </Button>
            </View>

            <Text style={[styles.actionInfo, { color: theme.colors.onSurfaceVariant }]}>
              Transactions will be processed within 24 hours
            </Text>
          </Card.Content>
        </Card>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Recent Transactions
          </Text>

          {/* Transaction Tabs */}
          <View style={styles.tabsContainer}>
            <Chip
              selected={activeTab === 'all'}
              onPress={() => setActiveTab('all')}
              style={[
                styles.tab,
                activeTab === 'all' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceVariant }
              ]}
              textStyle={[
                styles.tabText,
                { color: activeTab === 'all' ? '#FFFFFF' : theme.colors.onSurfaceVariant }
              ]}
            >
              All
            </Chip>
            <Chip
              selected={activeTab === 'pending'}
              onPress={() => setActiveTab('pending')}
              style={[
                styles.tab,
                activeTab === 'pending' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceVariant }
              ]}
              textStyle={[
                styles.tabText,
                { color: activeTab === 'pending' ? '#FFFFFF' : theme.colors.onSurfaceVariant }
              ]}
            >
              Pending
            </Chip>
            <Chip
              selected={activeTab === 'completed'}
              onPress={() => setActiveTab('completed')}
              style={[
                styles.tab,
                activeTab === 'completed' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceVariant }
              ]}
              textStyle={[
                styles.tabText,
                { color: activeTab === 'completed' ? '#FFFFFF' : theme.colors.onSurfaceVariant }
              ]}
            >
              Completed
            </Chip>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionsList}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                  No transactions found
                </Text>
              </View>
            ) : (
              filteredTransactions.map((transaction) => (
                <View key={transaction._id} style={[styles.transactionItem, { borderBottomColor: theme.colors.outline }]}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(transaction.transactionType)}20` }]}>
                      <Ionicons 
                        name={getTransactionIcon(transaction.transactionType)} 
                        size={20} 
                        color={getTransactionColor(transaction.transactionType)} 
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={[styles.transactionDescription, { color: theme.colors.onSurface }]}>
                        {transaction.description}
                      </Text>
                      <Text style={[styles.transactionType, { color: theme.colors.onSurfaceVariant }]}>
                        {transaction.paymentMethod?.toUpperCase() || 'System'}
                      </Text>
                      <Text style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction.transactionType) }]}>
                      {formatAmount(transaction.amount, transaction.transactionType)}
                    </Text>
                    <Text style={[styles.transactionTime, { color: theme.colors.onSurfaceVariant }]}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Cash In Modal */}
      <Portal>
        <Dialog visible={showCashInModal} onDismiss={() => setShowCashInModal(false)}>
          <Dialog.Title>Cash In</Dialog.Title>
          <Dialog.Content>
            {paymentDetails && (
              <>
                <Card style={[styles.paymentDetailsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Card.Content>
                    <Text style={[styles.paymentDetailsTitle, { color: theme.colors.onSurface }]}>
                      EasyPaisa Payment Details
                    </Text>
                    <Text style={[styles.paymentDetailsText, { color: theme.colors.onSurface }]}>
                      Account: {paymentDetails.details.accountNumber}
                    </Text>
                    <Text style={[styles.paymentDetailsText, { color: theme.colors.onSurface }]}>
                      Name: {paymentDetails.details.accountHolder}
                    </Text>
                  </Card.Content>
                </Card>

                <Text style={[styles.instructionsTitle, { color: theme.colors.onSurface }]}>
                  Instructions:
                </Text>
                {paymentDetails.instructions.map((instruction, index) => (
                  <Text key={index} style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                    {instruction}
                  </Text>
                ))}
              </>
            )}

            <TextInput
              style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
              placeholder="Enter amount (PKR)"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={cashInAmount}
              onChangeText={setCashInAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
              placeholder="Enter transaction ID"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={transactionId}
              onChangeText={setTransactionId}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCashInModal(false)}>Cancel</Button>
            <Button 
              onPress={submitCashIn} 
              loading={isSubmittingCashIn}
              disabled={isSubmittingCashIn}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Cash Out Modal */}
      <Portal>
        <Dialog visible={showCashOutModal} onDismiss={() => setShowCashOutModal(false)}>
          <Dialog.Title>Cash Out</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
              Enter your EasyPaisa account details for cash out:
            </Paragraph>

            <TextInput
              style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
              placeholder="Enter amount (PKR)"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={cashOutAmount}
              onChangeText={setCashOutAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
              placeholder="EasyPaisa account number"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={cashOutAccount}
              onChangeText={setCashOutAccount}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
              placeholder="Account holder name"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={cashOutHolder}
              onChangeText={setCashOutHolder}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCashOutModal(false)}>Cancel</Button>
            <Button 
              onPress={submitCashOut} 
              loading={isSubmittingCashOut}
              disabled={isSubmittingCashOut}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  balanceCard: {
    margin: 20,
    borderRadius: 16,
  },
  balanceContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionInfo: {
    fontSize: 12,
    textAlign: 'center',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 14,
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 14,
  },
  paymentDetailsCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentDetailsText: {
    fontSize: 14,
    marginBottom: 4,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
});

export default DriverWalletScreen;