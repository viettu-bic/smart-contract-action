// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentService is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    event Tip(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        string message
    );
    event Charge(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        string message
    );
    event WithdrawToken(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );


    // @deprecated
    event TipWithBytesMessage(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes message
    );
    // @deprecated
    event ChargeWithBytesMessage(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes message
    );

    constructor() {}

    function tip(
        IERC20 _token,
        address _to,
        uint256 _amount,
        string memory _message
    ) external {
        require(_amount > 0, "PMS:Amount must be greater than zero");
        address sender = msg.sender;
        _token.safeTransferFrom(sender, _to, _amount);

        emit Tip(_token, sender, _to, _amount, _message);
    }

    // @deprecated
    function tipWithBytesMessage(
        IERC20 _token,
        address _to,
        uint256 _amount,
        bytes memory _message
    ) external {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        address sender = msg.sender;
        _token.safeTransferFrom(sender, _to, _amount);

        emit TipWithBytesMessage(_token, sender, _to, _amount, _message);
    }

    function charge(
        IERC20 _token,
        uint256 _amount,
        string memory _message
    ) external {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        address sender = msg.sender;
        _token.safeTransferFrom(sender, address(this), _amount);
        emit Charge(_token, sender, address(this), _amount, _message);
    }


    // @deprecated
    function chargeWithBytesMessage(
        IERC20 _token,
        uint256 _amount,
        bytes memory _message
    ) external {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        address sender = msg.sender;
        _token.safeTransferFrom(sender, address(this), _amount);
        emit ChargeWithBytesMessage(_token, sender, address(this), _amount, _message);
    }

    function withdrawToken(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        _token.safeTransfer(_to, _amount);

        emit WithdrawToken(_token, msg.sender, _to, _amount);
    }
}
