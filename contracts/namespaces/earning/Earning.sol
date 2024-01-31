// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IEarning} from './interfaces/IEarning.sol';

contract Earning is IEarning {
    uint32 private _numerator;
    uint32 private _denominator;

    function getEarningRate() external view override returns (uint32, uint32) {
        return (_numerator, _denominator);
    }

    function setEarningRate(uint32 numerator, uint32 denominator) public virtual {
        _numerator = numerator;
        _denominator = denominator;
    }

    function calculateEarning(uint256 amount) external view override returns (uint256) {
        return (amount * _numerator) / _denominator;
    }
}
