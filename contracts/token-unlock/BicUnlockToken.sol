// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BicUnlockToken is Initializable, ReentrancyGuard {
    event ERC20Released(address beneficiary, uint256 amount, uint256 currentRewardStacks, uint256 stacks, uint64 timestamp);

    uint64 public constant DENOMINATOR = 10_000; // 100% = 10_000, 10% = 1_000, 1% = 100, 0.1% = 10,  0.01% = 1

    address private _erc20;
    address private _beneficiary;

    uint256 private _released;
    uint256 private _totalAmount;
    uint64 private _start;
    uint64 private _end;
    uint64 private _duration;
    uint64 private _maxRewardStacks;
    uint64 private _currentRewardStacks;
    uint64 private _unlockRate;

    constructor() payable {}

    /**
     * @dev Set the beneficiary, start timestamp and vesting duration of the vesting wallet.
     */
    function initialize(
        address erc20Address,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRateNumber
    ) public virtual initializer {
        require(beneficiaryAddress != address(0), "VestingWallet: beneficiary is zero address");
        require(totalAmount > 0, "VestingWallet: total amount invalid");
        require(durationSeconds > 0, "VestingWallet: duration invalid");
        require(unlockRateNumber > 0 && unlockRateNumber <= DENOMINATOR, "VestingWallet: unlock rate invalid");
        require(erc20Address != address(0), "VestingWallet: erc20 invalid");

        _beneficiary = beneficiaryAddress;
        _start = uint64(block.timestamp);
        _duration = durationSeconds;
        _erc20 = erc20Address;
        _totalAmount = totalAmount;
        _maxRewardStacks = DENOMINATOR / unlockRateNumber;
        _unlockRate = unlockRateNumber;
        _end = _start + _maxRewardStacks * durationSeconds;
        if (DENOMINATOR % unlockRateNumber > 0) {
            _end += 1 * durationSeconds;
        }
    }

    /**
     * @dev Getter for the unlock amount
     */
    function erc20() public view virtual returns (address) {
        return _erc20;
    }

    /**
     * @dev Getter for the unlock amount
     */
    function unlockTotalAmount() public view virtual returns (uint256) {
        return _totalAmount;
    }

    /**
     * @dev Getter for the unlock rate
     */
    function unlockRate() public view virtual returns (uint64) {
        return _unlockRate;
    }

    /**
     * @dev Getter for the beneficiary address.
     */
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Getter for the start timestamp.
     */
    function start() public view virtual returns (uint256) {
        return _start;
    }

    /**
     * @dev Getter for the end timestamp.
     */
    function end() public view virtual returns (uint256) {
        return _end;
    }

    /**
     * @dev Getter for the vesting duration.
     */
    function duration() public view virtual returns (uint256) {
        return _duration;
    }

    /**
     * @dev Getter for the latest vesting
     */
    function lastAtCurrentStack() public view virtual returns (uint256) {
        return _lastAtCurrentStack();
    }

    /**
     * @dev Getter for the latest vesting
     */
    function maxRewardStacks() public view virtual returns (uint256) {
        return _maxRewardStacks;
    }

    /**
     * @dev Getter for current count
     */
    function currentRewardStacks() public view virtual returns (uint256) {
        return _currentRewardStacks;
    }

    /**
     * @dev Getter for amount per duration
     */
    function amountPerDuration() public view virtual returns (uint256) {
        return _amountPerDuration();
    }

    /**
     * @dev Amount of token already released
     */
    function released() public view virtual returns (uint256) {
        return _released;
    }

    /**
     * @dev Getter for the amount of releasable `token` tokens. `token` should be the address of an
     * IERC20 contract.
     */
    function releasable() public view virtual returns (uint256, uint256) {
        return _vestingSchedule(uint64(block.timestamp));
    }

    /**
     * @dev Release the tokens that have already vested.
     *
     * Emits a {ERC20Released} event.
     */
    function release() public virtual nonReentrant {
        (uint256 amount, uint256 counter) = releasable();
        require(amount > 0, "VestingWallet: no tokens to release");

        _released += amount;
        _currentRewardStacks += uint64(counter);
        SafeERC20.safeTransfer(IERC20(_erc20), _beneficiary, amount);
        emit ERC20Released(_beneficiary, amount, _currentRewardStacks, counter, uint64(block.timestamp));
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint64 timestamp) internal view virtual returns (uint256, uint256) {
        if (timestamp < start()) {
            return (0, 0);
        } else if (timestamp > end()) {
            return (IERC20(_erc20).balanceOf(address(this)), _maxRewardStacks - _currentRewardStacks);
        } else {
            // check for the latest percent amount, if _currentRewardStacks < _count => amount is unlockRate, else release all token in contract
            if (_currentRewardStacks >= _maxRewardStacks) return (0, 0);

            uint256 elapsedTime = uint256(timestamp) - _lastAtCurrentStack();
            uint256 rewardStackCounter = elapsedTime / _duration;
            uint256 amount = rewardStackCounter * _amountPerDuration();

            return (amount, rewardStackCounter);
        }
    }

    function _amountPerDuration() internal view virtual returns (uint256) {
        return _totalAmount * _unlockRate / DENOMINATOR;
    }

    function _lastAtCurrentStack() internal view virtual returns (uint256) {
        return _start + (_duration * _currentRewardStacks);
    }
}
