// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "../smart-wallet/oracle/IOracle.sol";

contract TestOracle is IOracle {
    function getTokenValueOfEth(uint256 ethOutput) external pure override returns (uint256 tokenInput) {
        return ethOutput / 10000;
    }


    int256 public price;
    uint8 private _decimals_;

    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        _decimals_ = _decimals;
    }

    function setPrice(int256 _price) external {
        price = _price;
    }

    function setDecimals(uint8 _decimals) external {
        _decimals_ = _decimals;
    }

    function decimals() external view override returns (uint8) {
        return _decimals_;
    }

    function latestRoundData()
    external
    view
    override
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        // solhint-disable-next-line not-rely-on-time
        return (73786976294838215802, price, 1680509051, block.timestamp, 73786976294838215802);
    }
}
