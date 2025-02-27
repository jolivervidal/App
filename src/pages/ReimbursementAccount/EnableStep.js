import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import {View, Image} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import styles from '../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import Navigation from '../../libs/Navigation/Navigation';
import Text from '../../components/Text';
import compose from '../../libs/compose';
import ONYXKEYS from '../../ONYXKEYS';
import {ChatBubble, Close} from '../../components/Icon/Expensicons';
import MenuItem from '../../components/MenuItem';
import getBankIcon from '../../components/Icon/BankIcons';
import {getPaymentMethods} from '../../libs/actions/PaymentMethods';
import FullScreenLoadingIndicator from '../../components/FullscreenLoadingIndicator';
import bankAccountPropTypes from '../../components/bankAccountPropTypes';
import {navigateToConciergeChat} from '../../libs/actions/Report';
import confettiPop from '../../../assets/images/confetti-pop.gif';
import Icon from '../../components/Icon';
import WorkspaceSection from '../workspace/WorkspaceSection';
import {ConciergeBlue} from '../../components/Icon/Illustrations';
import {requestResetFreePlanBankAccount} from '../../libs/actions/BankAccounts';

const propTypes = {
    /** Are we loading payment methods? */
    isLoadingPaymentMethods: PropTypes.bool,

    /** Array of bank account objects */
    bankAccountList: PropTypes.arrayOf(bankAccountPropTypes),

    ...withLocalizePropTypes,
};

const defaultProps = {
    isLoadingPaymentMethods: true,
    bankAccountList: [],
};

class EnableStep extends React.Component {
    componentDidMount() {
        getPaymentMethods();
    }

    render() {
        if (this.props.isLoadingPaymentMethods || _.isEmpty(this.props.bankAccountList)) {
            return (
                <FullScreenLoadingIndicator />
            );
        }

        const isUsingExpensifyCard = this.props.user.isUsingExpensifyCard;
        const account = _.find(this.props.bankAccountList, bankAccount => bankAccount.bankAccountID === this.props.reimbursementAccount.achData.bankAccountID);
        if (!account) {
            // This shouldn't happen as we can only end up here if we have successfully added a bank account.
            // But in case it does we'll throw here directly so it can be caught by the error boundary.
            throw new Error('Account not found in EnableStep');
        }

        const {icon, iconSize} = getBankIcon(account.additionalData.bankName);
        const formattedBankAccountNumber = account.accountNumber
            ? `${this.props.translate('paymentMethodList.accountLastFour')} ${
                account.accountNumber.slice(-4)
            }`
            : '';
        const bankName = account.addressName;
        const menuItems = [{
            title: this.props.translate('workspace.bankAccount.disconnectBankAccount'),
            icon: Close,
            onPress: requestResetFreePlanBankAccount,
        }];
        if (!isUsingExpensifyCard) {
            menuItems.unshift({
                title: this.props.translate('workspace.bankAccount.chatWithConcierge'),
                icon: ChatBubble,
                onPress: () => {
                    navigateToConciergeChat();
                },
                shouldShowRightIcon: true,
            });
        }

        return (
            <View style={[styles.flex1, styles.justifyContentBetween]}>
                <HeaderWithCloseButton
                    title={this.props.translate('workspace.common.bankAccount')}
                    onCloseButtonPress={Navigation.dismissModal}
                    shouldShowBackButton
                    onBackButtonPress={() => Navigation.goBack()}
                />
                <View style={[styles.flex1]}>
                    <WorkspaceSection
                        title={!isUsingExpensifyCard ? this.props.translate('workspace.bankAccount.oneMoreThing') : this.props.translate('workspace.bankAccount.allSet')}
                        IconComponent={() => (!isUsingExpensifyCard ? <Icon src={ConciergeBlue} width={80} height={80} /> : <Image source={confettiPop} style={styles.confettiIcon} />)}
                        menuItems={menuItems}
                    >
                        <MenuItem
                            title={bankName}
                            description={formattedBankAccountNumber}
                            icon={icon}
                            iconWidth={iconSize}
                            iconHeight={iconSize}
                            disabled
                            interactive={false}
                            wrapperStyle={[styles.ph0, styles.mb3]}
                        />
                        <Text>
                            {!isUsingExpensifyCard
                                ? this.props.translate('workspace.bankAccount.accountDescriptionNoCards')
                                : this.props.translate('workspace.bankAccount.accountDescriptionWithCards')}
                        </Text>
                    </WorkspaceSection>
                </View>
            </View>
        );
    }
}

EnableStep.propTypes = propTypes;
EnableStep.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withOnyx({
        isLoadingPaymentMethods: {
            key: ONYXKEYS.IS_LOADING_PAYMENT_METHODS,
            initWithStoredValues: false,
        },
        user: {
            key: ONYXKEYS.USER,
        },
        reimbursementAccount: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
        },
        bankAccountList: {
            key: ONYXKEYS.BANK_ACCOUNT_LIST,
            initWithStoredValues: false,
        },
    }),
)(EnableStep);
