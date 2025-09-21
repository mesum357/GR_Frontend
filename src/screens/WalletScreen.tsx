import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, TextInput as PaperTextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mockTransactions = [
  {
    id: 1,
    type: 'credit',
    amount: 150,
    description: 'Ride payment from Sarah Khan',
    date: '2024-01-15',
    time: '14:30',
    status: 'completed'
  },
  {
    id: 2,
    type: 'debit',
    amount: 50,
    description: 'Wallet top-up',
    date: '2024-01-14',
    time: '10:15',
    status: 'completed'
  },
  {
    id: 3,
    type: 'credit',
    amount: 200,
    description: 'Ride payment from Ahmad Ali',
    date: '2024-01-13',
    time: '16:45',
    status: 'completed'
  }
];

export default function WalletScreen() {
  const { theme } = useTheme();
  const [balance, setBalance] = useState(1250);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const insets = useSafeAreaInsets();

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Please enter a valid amount',
      });
      return;
    }

    setBalance(prev => prev + amount);
    setTopUpAmount('');
    setShowTopUp(false);
    Toast.show({
      type: 'success',
      text1: 'Top-up successful!',
      text2: `Added PKR ${amount} to your wallet`,
    });
  };

  const handleWithdraw = () => {
    if (balance <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient balance',
      });
      return;
    }

    Alert.alert(
      'Withdraw Funds',
      `Withdraw PKR ${balance} to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            setBalance(0);
            Toast.show({
              type: 'success',
              text1: 'Withdrawal successful!',
              text2: 'Funds will be transferred within 24 hours',
            });
          }
        }
      ]
    );
  };

  const TransactionItem = ({ transaction }: any) => (
    <View style={[styles.transactionItem, { borderBottomColor: theme.colors.outline }]}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { 
          backgroundColor: transaction.type === 'credit' 
            ? theme.colors.primaryContainer 
            : theme.colors.errorContainer 
        }]}>
          <Ionicons 
            name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={transaction.type === 'credit' 
              ? theme.colors.onPrimaryContainer 
              : theme.colors.onErrorContainer
            } 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, { color: theme.colors.onSurface }]}>
            {transaction.description}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.onSurfaceVariant }]}>
            {transaction.date} at {transaction.time}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { 
          color: transaction.type === 'credit' 
            ? theme.colors.primary 
            : theme.colors.error 
        }]}>
          {transaction.type === 'credit' ? '+' : '-'}PKR {transaction.amount}
        </Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: theme.colors.primaryContainer 
        }]}>
          <Text style={[styles.statusText, { color: theme.colors.onPrimaryContainer }]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 120 + insets.bottom : 120,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>Wallet</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>Manage your money</Text>
          </View>
        </View>

        {/* Balance Card */}
        <Card style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
          <Card.Content>
            <Text style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>Current Balance</Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.onPrimary }]}>PKR {balance}</Text>
            <View style={styles.balanceActions}>
              <Button
                mode="contained"
                onPress={() => setShowTopUp(true)}
                style={styles.topUpButton}
                buttonColor={theme.colors.onPrimary}
                textColor={theme.colors.primary}
              >
                Top Up
              </Button>
              <Button
                mode="outlined"
                onPress={handleWithdraw}
                style={styles.withdrawButton}
                textColor={theme.colors.onPrimary}
                disabled={balance <= 0}
              >
                Withdraw
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Top Up Modal */}
        {showTopUp && (
          <Card style={[styles.topUpCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.topUpTitle, { color: theme.colors.onSurface }]}>Top Up Wallet</Title>
              <PaperTextInput
                label="Amount (PKR)"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="numeric"
                mode="outlined"
                style={styles.topUpInput}
                theme={theme}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
              />
              <View style={styles.topUpActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowTopUp(false)}
                  style={styles.cancelButton}
                  textColor={theme.colors.primary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleTopUp}
                  style={styles.confirmButton}
                  buttonColor={theme.colors.primary}
                  disabled={!topUpAmount}
                >
                  Confirm
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Ionicons name="card" size={24} color={theme.colors.onPrimaryContainer} />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>Add Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Ionicons name="swap-horizontal" size={24} color={theme.colors.onSecondaryContainer} />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Ionicons name="receipt" size={24} color={theme.colors.onTertiaryContainer} />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <Card style={[styles.transactionsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Recent Transactions</Title>
            {mockTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  balanceCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topUpButton: {
    flex: 1,
  },
  withdrawButton: {
    flex: 1,
  },
  quickActions: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    minWidth: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  topUpCard: {
    margin: 20,
    borderRadius: 16,
    elevation: 4,
  },
  topUpTitle: {
    marginBottom: 16,
  },
  topUpInput: {
    marginBottom: 16,
  },
  topUpActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
