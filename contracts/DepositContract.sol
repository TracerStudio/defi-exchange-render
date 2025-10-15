// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DepositContract
 * @dev Contract for USDT/USDC deposits with admin withdrawal functionality
 */
contract DepositContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Token addresses on Ethereum mainnet
    address public constant USDT_ADDRESS = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event AdminWithdrawal(address indexed token, uint256 amount, uint256 timestamp);
    event EmergencyWithdrawal(address indexed token, uint256 amount, uint256 timestamp);
    event VirtualSwap(address indexed user, address indexed fromToken, address indexed toToken, uint256 amount, uint256 timestamp);

    // User balances mapping: user => token => balance
    mapping(address => mapping(address => uint256)) public userBalances;
    
    // Virtual balances for UI simulation: user => token => virtual balance
    mapping(address => mapping(address => uint256)) public virtualBalances;
    
    // Total deposits per token
    mapping(address => uint256) public totalDeposits;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    
    // User deposit history
    struct DepositRecord {
        address token;
        uint256 amount;
        uint256 timestamp;
    }
    
    mapping(address => DepositRecord[]) public userDepositHistory;

    constructor() Ownable(msg.sender) {
        // Initialize supported tokens
        supportedTokens[USDT_ADDRESS] = true;
        supportedTokens[USDC_ADDRESS] = true;
    }

    /**
     * @dev Deposit USDT or USDC tokens
     * @param token Token contract address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external whenNotPaused nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(token).balanceOf(msg.sender) >= amount, "Insufficient token balance");
        require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        // Transfer tokens from user to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user balance
        userBalances[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        
        // Update virtual balance (same as real balance initially)
        virtualBalances[msg.sender][token] += amount;
        
        // Record deposit history
        userDepositHistory[msg.sender].push(DepositRecord({
            token: token,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev User withdraw their deposited tokens
     * @param token Token contract address
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external whenNotPaused nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(userBalances[msg.sender][token] >= amount, "Insufficient balance");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Contract insufficient balance");

        // Update balances
        userBalances[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawal(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev Admin withdraw all tokens of a specific type
     * @param token Token contract address
     */
    function adminWithdrawAll(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        // Transfer all tokens to owner
        IERC20(token).safeTransfer(owner(), balance);
        
        emit AdminWithdrawal(token, balance, block.timestamp);
    }

    /**
     * @dev Admin withdraw specific amount of tokens
     * @param token Token contract address
     * @param amount Amount to withdraw
     */
    function adminWithdraw(address token, uint256 amount) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        // Transfer tokens to owner
        IERC20(token).safeTransfer(owner(), amount);
        
        emit AdminWithdrawal(token, amount, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal - withdraw all tokens (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 usdtBalance = IERC20(USDT_ADDRESS).balanceOf(address(this));
        uint256 usdcBalance = IERC20(USDC_ADDRESS).balanceOf(address(this));
        
        if (usdtBalance > 0) {
            IERC20(USDT_ADDRESS).safeTransfer(owner(), usdtBalance);
            emit EmergencyWithdrawal(USDT_ADDRESS, usdtBalance, block.timestamp);
        }
        
        if (usdcBalance > 0) {
            IERC20(USDC_ADDRESS).safeTransfer(owner(), usdcBalance);
            emit EmergencyWithdrawal(USDC_ADDRESS, usdcBalance, block.timestamp);
        }
    }

    /**
     * @dev Add new supported token
     * @param token Token contract address
     */
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    /**
     * @dev Remove supported token
     * @param token Token contract address
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get user's total balance for a token
     * @param user User address
     * @param token Token address
     * @return balance User's balance
     */
    function getUserBalance(address user, address token) external view returns (uint256 balance) {
        return userBalances[user][token];
    }

    /**
     * @dev Get user's deposit history
     * @param user User address
     * @return history Array of deposit records
     */
    function getUserDepositHistory(address user) external view returns (DepositRecord[] memory history) {
        return userDepositHistory[user];
    }

    /**
     * @dev Get contract's token balance
     * @param token Token address
     * @return balance Contract's balance
     */
    function getContractBalance(address token) external view returns (uint256 balance) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get total deposits for a token
     * @param token Token address
     * @return total Total deposits
     */
    function getTotalDeposits(address token) external view returns (uint256 total) {
        return totalDeposits[token];
    }

    /**
     * @dev Simulate swap between tokens (virtual only)
     * @param fromToken Token to swap from
     * @param toToken Token to swap to
     * @param amount Amount to swap
     */
    function simulateSwap(address fromToken, address toToken, uint256 amount) external whenNotPaused {
        require(supportedTokens[fromToken], "From token not supported");
        require(supportedTokens[toToken], "To token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(virtualBalances[msg.sender][fromToken] >= amount, "Insufficient virtual balance");
        require(fromToken != toToken, "Cannot swap same token");

        // Update virtual balances
        virtualBalances[msg.sender][fromToken] -= amount;
        virtualBalances[msg.sender][toToken] += amount;

        emit VirtualSwap(msg.sender, fromToken, toToken, amount, block.timestamp);
    }

    /**
     * @dev Get user's virtual balance for a token
     * @param user User address
     * @param token Token address
     * @return balance Virtual balance
     */
    function getVirtualBalance(address user, address token) external view returns (uint256 balance) {
        return virtualBalances[user][token];
    }

    /**
     * @dev Reset user's virtual balances to match real balances (admin only)
     * @param user User address
     */
    function resetVirtualBalances(address user) external onlyOwner {
        virtualBalances[user][USDT_ADDRESS] = userBalances[user][USDT_ADDRESS];
        virtualBalances[user][USDC_ADDRESS] = userBalances[user][USDC_ADDRESS];
    }
}
