import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Alert, Picker } from 'react-native';
import AccountStyles from './Account.styles';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import { runQuery } from '../../database';
import { logIn, logOut, newUser } from '../../util/actions';
import { generalStyles, colors } from '../../App.styles';
import { Header } from '../Shared/SharedComponents';

interface OrderProps {
  bookAppStore: any,
	logIn: Function,
	logOut: Function,
	newUser: Function,
}

interface OrderState {
  showOrders: boolean,
  showBilling: boolean,
  orders: any [],
  inputUsername: null | string,
  inputPassword: null | string,
  inputPublisherId: null | string,
  inputPublisherName: null | string,
  inputPublisherAddress: null | string,
  inputPublisherBankNumber: null | string,
  inputPublisherPhone: null | string,
  showNewAdmin: boolean,
  showNewPublisher: boolean,
  newAdminSelection: null | string,
  availableUsers: any []
}

class Account extends React.Component <OrderProps, OrderState> {
  constructor(props) {
    super(props);
    this.state = {
      showOrders: false,
      showBilling: false,
      showNewAdmin: false,
      inputUsername: null,
      inputPassword: null,
      inputPublisherId: null,
      inputPublisherName: null,
      inputPublisherAddress: null,
      inputPublisherBankNumber: null,
      inputPublisherPhone: null,
      showNewPublisher: false,
      newAdminSelection: null,
      orders: [],
      availableUsers: []
    }
  }

  registerUser = () => {
    const { inputUsername, inputPassword } = this.state;

    if (inputUsername && inputPassword) {
      this.props.newUser({ inputUsername, inputPassword })
    } else {
      Alert.alert(
        'LookinnaBook',
        `Please enter a valid username and password`,
        [{
          text: 'Done',
          style: 'default'
        }], {
          cancelable: true
        }
      );
    }
  }

  deleteAccount = () => {
    
  }

  userLogin = () => {
    const { inputPassword, inputUsername } = this.state;

    if (inputPassword && inputUsername) {
      runQuery(`
        select *
        from users
        where password = '${inputPassword}' 
        and username = '${inputUsername}';
      `).then((result: any) => {
        const results = result._array;

        if (result.length > 0) {
          const user = results[0];
          this.props.logIn(user);
        } else {
          Alert.alert(
            'LookinnaBook',
            `Those credentials didn't seem to work, please verify your username and password`,
            [{
              text: 'Done',
              style: 'default'
            }], {
              cancelable: true
            }
          );
        }
      })
    } else {
      Alert.alert(
        'LookinnaBook',
        `Please enter valid credentials!`,
        [{
          text: 'Done',
          style: 'default',
        }], {
          cancelable: true,
        }
      );
    }
  }

  updateOrders = () => {
    const { currUser } = this.props.bookAppStore;
    
    runQuery(`
      select * 
      from orders 
      where user_ID = '${currUser.userId}'
    `).then((result: any) => {
      const results = result._array;

      this.setState({ orders: results });
    })
  }

  verifyUniquePublisher = async (targetID) => {
    return await runQuery(`
      select publisher_ID from publisher where publisher_ID = '${targetID}'
    `).then((res: any) => {
      if (res._array.length === 0) {
        return Promise.resolve(true)
      } else {
        return Promise.resolve(false)
      }
    })
  }

  createNewPublisher = async () => {
    const {
      inputPublisherId, 
      inputPublisherName,
      inputPublisherAddress,
      inputPublisherBankNumber,
      inputPublisherPhone 
    } = this.state;

    if (inputPublisherId &&
      inputPublisherName &&
      inputPublisherAddress &&
      inputPublisherBankNumber &&
      inputPublisherPhone && 
      inputPublisherPhone &&
      await this.verifyUniquePublisher(inputPublisherId)
    ) {
      runQuery(`
        insert into publisher (
          publisher_ID, name, bank_number, address, phone_num
        )
        values (
            '${inputPublisherId}', '${inputPublisherName}', ${inputPublisherBankNumber}, '${inputPublisherAddress}', '${inputPublisherPhone}'
        );
      `)
      this.setState({ showNewPublisher: false });
    } else {
      Alert.alert(
        'LookinnaBook',
        `Please verify your information and try again!`,
        [{
          text: 'Done',
          style: 'default',
        }], {
          cancelable: true,
        }
      );
    }
  }

  createNewAdmin = () => {
    const { newAdminSelection } = this.state;

    runQuery(`
      update users
      set role_ID = 'r-00'
      where username = '${newAdminSelection}';
    `).then((result: any) => {
      Alert.alert(
        'LookinnaBook',
        `${newAdminSelection} is now an admin!`,
        [{
          text: 'Done',
          style: 'default'
        }], {
          cancelable: true
        }
      );

      this.setState({ showNewAdmin: false, newAdminSelection: null });
    });
  }

  render() {
    const { currUser } = this.props.bookAppStore;
    const { showOrders, 
      showBilling, 
      inputPassword, 
      inputUsername, 
      orders, 
      showNewPublisher, 
      inputPublisherId, 
      inputPublisherName,
      inputPublisherAddress,
      inputPublisherBankNumber,
      inputPublisherPhone,
      showNewAdmin,
      availableUsers,
      newAdminSelection
    } = this.state;

    return (
      <View style={AccountStyles.accountContainer}>
        {currUser !== null && (
          <View>
            <Modal
              onShow={() => this.updateOrders()}
              animationType='fade'
              transparent={true}
              visible={showOrders}
            >
              <View style={generalStyles.overlayContainer}>
                <View style={generalStyles.contentOverlayContainer}>
                  <Text style={[generalStyles.cardHeader]}>
                    Your order history
                  </Text>
                  <ScrollView style={AccountStyles.orderHistoryContainer}>
                    {orders.map((order, index) => (
                      <View style={AccountStyles.orderContainer} key={index}>
                        <View style={AccountStyles.orderDescriptionContainer}>
                          <Text style={[generalStyles.header1, { textAlign: 'left' }]}>
                            {`#${order.id}`}
                          </Text>
                          <Text style={[generalStyles.header1Bold, { textAlign: 'right' }]}>
                            {`$${order.price.toFixed(2)}`}
                          </Text>
                        </View>
                        <View style={AccountStyles.orderDescriptionContainer}>
                          <Text style={[generalStyles.header2]}>
                            {`${order.date.getDate()}/${order.date.getMonth()}/${order.date.getFullYear()}`}
                          </Text>
                          <Text style={[generalStyles.header2]}>
                            {`tracking #${order.tracking}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity 
                    style={generalStyles.closeOverlayButton} 
                    onPress={() => this.setState({ showOrders: false })}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      done 
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal 
              animationType='fade'
              transparent={true}
              visible={showNewPublisher}
            >
              <View style={generalStyles.overlayContainer}>
                <View style={generalStyles.contentOverlayContainer}>
                  <ScrollView style={AccountStyles.orderHistoryContainer}>
                    <Text style={[generalStyles.cardHeader]}>
                      Create a new publisher
                    </Text>
                    <View style={AccountStyles.billingInfoContainer}>
                      <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                        Name
                      </Text>
                      <TextInput
                        style={[generalStyles.header1, AccountStyles.billingInfoInputBox]} 
                        onChangeText={(input) => this.setState({ inputPublisherName: input })}
                        value={inputPublisherName}
                      />

                      <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                        id
                      </Text>
                      <TextInput 
                        style={[generalStyles.header1, AccountStyles.billingInfoInputBox]}
                        onChangeText={(input) => this.setState({ inputPublisherId: input })}
                        value={inputPublisherId}
                      />

                      <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                        Bank account
                      </Text>
                      <TextInput 
                        style={[generalStyles.header1, AccountStyles.billingInfoInputBox]}
                        onChangeText={(input) => this.setState({ inputPublisherBankNumber: input })}
                        value={inputPublisherBankNumber}
                        keyboardType='number-pad'
                      />

                      <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                        Address
                      </Text>
                      <TextInput 
                        style={[generalStyles.header1, AccountStyles.billingInfoInputBox]}
                        onChangeText={(input) => this.setState({ inputPublisherAddress: input })}
                        value={inputPublisherAddress}
                      />

                      <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                        Phone number
                      </Text>
                      <TextInput 
                        style={[generalStyles.header1, AccountStyles.billingInfoInputBox]}
                        onChangeText={(input) => this.setState({ inputPublisherPhone: input })}
                        value={inputPublisherPhone}
                        keyboardType='phone-pad'
                      />
                    </View>
                  </ScrollView>
                  <TouchableOpacity
                    style={generalStyles.closeOverlayButton} 
                    onPress={() => this.createNewPublisher()}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={generalStyles.exitOverlayButton} 
                    onPress={() => this.setState({ showNewPublisher: false })}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal 
              animationType='fade'
              transparent={true}
              visible={showNewAdmin}
              onShow={() => {
                runQuery(`
                  select username 
                  from users
                  where role_ID not in ('r-00');
                `).then((result: any) => {
                  const users = result._array.reduce((acc: any [], user) => {
                    acc.push(user.username);
                    return acc;
                  }, []);

                  if (users.length === 1) {
                    this.setState({ availableUsers: users, newAdminSelection: users[0] });
                  } else {
                    this.setState({ availableUsers: users });
                  }
                })
              }}
            >
              <View style={generalStyles.overlayContainer}>
                <View style={generalStyles.contentOverlayContainer}>
                  <View>
                    <Text style={[generalStyles.cardHeader]}>
                      Make a user an admin 
                    </Text>
                    <Text style={[generalStyles.subheader2]}>
                      Select a username from the dropdown
                    </Text>
                  </View>
                  {availableUsers.length > 0 ? (
                    <Picker 
                      onValueChange={(value) => this.setState({ newAdminSelection: value })}
                      selectedValue={newAdminSelection}
                      style={{ width: '100%', marginTop: 20, marginBottom: 20, alignItems: 'center' }}>
                      {availableUsers.map((username, index) => (
                        <Picker.Item key={index} label={username} value={username} />
                      ))}
                    </Picker>
                  ) : (
                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                      <Text style={[generalStyles.subheader1]}>
                        There are no available users!
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={generalStyles.closeOverlayButton} 
                    onPress={() => this.createNewAdmin()}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={generalStyles.exitOverlayButton} 
                    onPress={() => this.setState({ showNewAdmin: false })}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal
              animationType='fade'
              transparent={true}
              visible={showBilling}
            >
              <View style={generalStyles.overlayContainer}>
                <View style={generalStyles.contentOverlayContainer}>
                  <Text style={[generalStyles.cardHeader]}>
                    Your billing information
                  </Text>
                  <View style={AccountStyles.billingInfoContainer}>
                    <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                      Card number
                    </Text>
                    <TextInput 
                      style={[generalStyles.header1, AccountStyles.billingInfoInputBox]} 
                      placeholder={currUser.cardNumber.toString()} 
                    />

                    <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                      Expiry date
                    </Text>
                    <TextInput 
                      style={[generalStyles.header1, AccountStyles.billingInfoInputBox]} 
                      placeholder={`${currUser.expiryMonth.toString()}/${currUser.expiryYear.toString()}`} 
                    />

                    <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                      Address
                    </Text>
                    <TextInput 
                      style={[generalStyles.header1, AccountStyles.billingInfoInputBox]} 
                      placeholder={currUser.address} 
                    />

                    <Text style={[generalStyles.subheader1, { marginTop: 10 }]}>
                      Phone number
                    </Text>
                    <TextInput 
                      style={[generalStyles.header1, AccountStyles.billingInfoInputBox]} 
                      placeholder={currUser.phoneNumber} 
                    />
                  </View>
                  <TouchableOpacity
                    style={generalStyles.closeOverlayButton} 
                    onPress={() => this.setState({ showBilling: false })}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      close & save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={generalStyles.exitOverlayButton} 
                    onPress={() => this.setState({ showBilling: false })}
                  >
                    <Text style={[generalStyles.actionExit, { color: colors.blue }]}>
                      close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}

        <View style={AccountStyles.headerContainer}>
          <Header title="Account" />
        </View>
        {currUser === null ? (
          <View style={[AccountStyles.loginContainer]}>
            <TextInput 
              style={[generalStyles.header1, AccountStyles.loginInputBox]} 
              placeholder="username"
              value={inputUsername}
              onChangeText={(input) => this.setState({ inputUsername: input })}
              autoCapitalize="none"
            />
            <TextInput 
              secureTextEntry={true} 
              style={[generalStyles.header1, AccountStyles.loginInputBox]} 
              placeholder="password"
              value={inputPassword}
              onChangeText={(input) => this.setState({ inputPassword: input })}
            />
            <View style={{ width: '100%', marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => this.registerUser()} style={[AccountStyles.loginButton, { width: '47%' }]}>
                <Text style={[generalStyles.actionButton]}>
                  register
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => this.userLogin()} style={[AccountStyles.loginButton, { width: '47%' }]}>
                <Text style={[generalStyles.actionButton]}>
                  log in
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[AccountStyles.loginContainer]}>
            <Text style={[generalStyles.header2, { fontSize: 36, textAlign: 'center' }]}>
              {`Hello, ${currUser.username}\n`}
              <Text style={[generalStyles.subheader1]}>
                good to see you again
              </Text>
            </Text>
            <TouchableOpacity onPress={() => this.setState({ showOrders: true })} style={{ marginTop: 30 }}>
              <Text style={[generalStyles.actionButton, { color: colors.blue }]}>
                order history
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.setState({ showBilling: true })} style={{ marginTop: 10 }}>
              <Text style={[generalStyles.actionButton, { color: colors.blue }]}>
                billing information 
              </Text>
            </TouchableOpacity>
            {currUser.admin && (
              <View style={{ justifyContent: 'center', width: '100%', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => this.setState({ showNewPublisher: true })} style={{ marginTop: 10 }}>
                  <Text style={[generalStyles.actionButton, { color: colors.blue }]}>
                    new publisher
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.setState({ showNewAdmin: true })} style={{ marginTop: 10 }}>
                  <Text style={[generalStyles.actionButton, { color: colors.blue }]}>
                    new admin
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.setState({ showBilling: true })} style={{ marginTop: 10 }}>
                  <Text style={[generalStyles.actionButton, { color: colors.blue }]}>
                    sales reports 
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => this.props.logOut()} style={AccountStyles.loginButton}>
              <Text style={[generalStyles.actionButton]}>
                log out 
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.deleteAccount()} style={{ marginTop: 10 }}>
              <Text style={[generalStyles.subheader1, { color: colors.red }]}>
                delete account 
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

const mapDispatchToProps = dispatch => (
  bindActionCreators({
    logIn,
    logOut,
    newUser
  }, dispatch)
);

const mapStateToProps = (state) => {
  const { bookAppStore } = state
  return { bookAppStore }
};

export default connect(mapStateToProps, mapDispatchToProps)(Account);