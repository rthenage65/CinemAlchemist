import React from 'react';

class DeleteButton extends React.Component {
  // a delete button with a confirmation message
  constructor(props) {
    super(props);
    this.state = {
      needsConfirmation: false
    };
  }

  confirmationTimeout = undefined;

  render() { try {
    const {needsConfirmation} = this.state;
    const {
      onClick:propsOnClick = ()=>{}, 
      // size = "tiny", 
      className:propsClassName = undefined, 
      containerClassName = "", 
      tooltipDirection = "left", 
      tooltipText = undefined, 
      // buttonType = "text", 
      buttonText = "Delete", 
      confirmationMessage = "confirm delete?"
    } = this.props;
    const className = propsClassName ?? "";//`${size}-icon blue-bg deleteButton`
    const onClick = (e) => {
      e.stopPropagation();
      if (needsConfirmation) {
        clearTimeout(this.confirmationTimeout);
        this.setState({needsConfirmation: false});
        propsOnClick();
      } else {
        this.setState({needsConfirmation: true});
        this.confirmationTimeout = setTimeout(() => {
          this.setState({needsConfirmation: false});
        }, 3000);
      }
    };
    let button;
    if (needsConfirmation) {
      button  = (
        <button
          className="text-white bg-danger"
          onClick={onClick}
        >{confirmationMessage}</button>);
    // } else if (buttonType === "icon") {
    //     button  = (
    //         <img 
    //             src={imagefolder+"/delete-icon-light.svg"} 
    //             alt="delete" 
    //             className={className}
    //             onClick={onClick}
    //         /> )
    } else {
      button  = (
        <button
          className={className}
          onClick={onClick}
        >{buttonText}</button>);
    }
    if (tooltipText) {
      return (
        <div className={"tooltip-container front-hover " + containerClassName}>
          {button}
          <div className={`${tooltipDirection} tooltip`}>{tooltipText}</div>
        </div> 
      );
    } else {
      return button;
    }
  } catch (e) {
    console.error(e);
    return (<div>An error has occurred.</div>);
  }}
}

export default DeleteButton;