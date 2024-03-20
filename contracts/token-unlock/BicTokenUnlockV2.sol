// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";



contract BicUnlockTokenV2 is Context, Initializable {
    event ERC20Released(address indexed token, uint256 amount);
    uint64 public constant P_DECIMALS = 100_000;


    address private _erc20;
    address private _beneficiary;

    uint256 private _released;
    uint256 private _erc20Released;
    uint256 private _totalAmount;
    uint256 private _amountPerSecond;
    uint64 private _start;
    uint64 private _end;
    uint64 private _duration;
    uint64 private _count;
    uint64 private _currentCount;
    uint64 private _unlockRate;


    
    constructor() payable { }

    /**
     * @dev Set the beneficiary, start timestamp and vesting duration of the vesting wallet.
     */
    function initialize(address erc20, uint256 totalAmount, address beneficiaryAddress, uint256 timeSpan, uint64 durationSeconds, uint64 unlockRateNumber) public virtual initializer {
        require(beneficiaryAddress != address(0), "VestingWallet: beneficiary is zero address");
        require(totalAmount > 0, "VestingWallet: total amount invalid");
        require(unlockRateNumber > 0 && unlockRateNumber <= P_DECIMALS, "VestingWallet: unlock rate invalid");
        require(erc20 != address(0), "VestingWallet: erc20 invalid");

        _beneficiary = beneficiaryAddress;
        _start = uint64(block.timestamp);

        uint256 weeksRemaining = timeSpan * unlockRateNumber / P_DECIMALS;
        uint256 amountPerSecondNumber = totalAmount / weeksRemaining;
        _count = uint64(weeksRemaining / durationSeconds);
        _end = _start + uint64(weeksRemaining);
        _duration = durationSeconds;
        _erc20 = erc20;
        _totalAmount = totalAmount;
        _unlockRate = unlockRateNumber;
        _amountPerSecond = amountPerSecondNumber;
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
    function lastAtCurrentCount() public view virtual returns (uint256) {
        return _start + (_duration * _currentCount);
    }

    /**
     * @dev Getter for the latest vesting
     */
    function count() public view virtual returns (uint256) {
        return _count;
    }

    /**
     * @dev Getter for current count
     */
    function currentCount() public view virtual returns (uint256) {
        return _currentCount;
    }

    /**
     * @dev Getter for amount per duration
     */
    function amountPerSecond() public view virtual returns (uint256) {
        return _amountPerSecond;
    }

    /**
     * @dev Getter for amount per duration
     */
    function amountPerDuration() public view virtual returns (uint256) {
        return _duration * _amountPerSecond;
    }

    /**20366598778003497600n, 20408163265306122448n
     * @dev Amount of token already released
     */
    function released() public view virtual returns (uint256) {
        return _erc20Released;
    }

    /**
     * @dev Getter for the amount of releasable `token` tokens. `token` should be the address of an
     * IERC20 contract.
     */
    function releasable() public view virtual returns (uint256, uint256) {
        return _vestingSchedule(uint64(block.timestamp));
    }

        /**
     * @dev Calculates the amount of tokens that has already vested. Default implementation is a linear vesting curve.
     */
    function releasable(uint64 timestamp) public view virtual returns (uint256, uint256) {
        return _vestingSchedule(timestamp);
    }

    /**
     * @dev Release the tokens that have already vested.
     *
     * Emits a {ERC20Released} event.
     */
    function release() public virtual {
        (uint256 amount, uint256 intervals) = releasable();
        require(amount > 0, "VestingWallet: no tokens to release");
        
        _erc20Released += amount;
        _currentCount+= uint64(intervals);
        emit ERC20Released(_erc20, amount);
        SafeERC20.safeTransfer(IERC20(_erc20), beneficiary(), amount);
    }



    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint64 timestamp) internal view virtual returns (uint256, uint256) {
        if (timestamp < start()) {
            return (0, 0);
        } else if (timestamp > end()) {
            return (IERC20(_erc20).balanceOf(address(this)), _count - _currentCount); // Allow user vest all amount in contract
        } else {
            uint256 elapsedTime = uint256(timestamp) - lastAtCurrentCount();
            uint256 totalInterval = elapsedTime / duration();
            // TODO please check claimedIntervals = 0;
            uint256 amount = totalInterval * amountPerDuration();
            
            return (amount, totalInterval);
        }
    }

}
