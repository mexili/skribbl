import React, { Component } from 'react'
import {SketchField, Tools} from '../SketchField';
// import {SketchField, Tools} from 'react-sketch';
import classNames from "./index.css";
import { Menu, Dropdown, Drawer, Timeline, Spin } from 'antd';
import { CheckOutlined, UpOutlined, UserOutlined, EditOutlined, LogoutOutlined, ShareAltOutlined, HistoryOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import tshirtSVG from '../images/shirt.svg'
import SkribblBoard from './SkribblBoard'
import { Modal, Button } from 'antd';
import axios from 'axios';
import {
    TelegramShareButton,
    TelegramIcon,
    FacebookShareButton,
    FacebookIcon,
    FacebookMessengerShareButton,
    FacebookMessengerIcon,
    LinkedinShareButton,
    LinkedinIcon,
    TwitterShareButton,
    TwitterIcon,
    WhatsappShareButton,
    WhatsappIcon
  } from "react-share";

class SketchBoard extends Component {
    constructor(props){
        super(props)
        this.state = {
            json: {},
            tempJson: {},
            opacity: 0,
            visible: false,
            dvisible: false,
            hvisible: false,
            hloader: false,
            cancelButtonDisplay: 'none',
            spinMessage: '',
            email: this.props.user.email.split("@")[0].replace(/\./g,"_"),
            url: this.props.url,
            username: '',
            edit: 1, // 0->need to close mainboard 1->Can edit tshirt 2->need to close tempboard
            trigger: ['click'],
            skribblHistory: []
        }
    }

    componentDidMount() {
        // console.log(this._sketch._canvas.clientWidth, this._sketch._canvas.clientHeight)
        this.getUserData();
        window.history.pushState({}, null, this.state.url);
    }

    _resize = (objects, prevWidth, prevHeight, curWidth, curHeight) => {
        let wfactor = ((curWidth) / prevWidth).toFixed(2);
        let hfactor = ((curHeight) / prevHeight).toFixed(2);
        for (let i in objects) {
            let obj = objects[i];
            let scaleX = obj.scaleX;
            let scaleY = obj.scaleY;
            let left = obj.left;
            let top = obj.top;
            let tempScaleX = scaleX * wfactor;
            let tempScaleY = scaleY * hfactor;
            let tempLeft = left * wfactor;
            let tempTop = top * hfactor;
            obj.scaleX = tempScaleX;
            obj.scaleY = tempScaleY;
            obj.left = tempLeft;
            obj.top = tempTop;
            // obj.setCoords()
          }
    }

    _centerAlign = (objects, offset) => {
        for (let i in objects) {
            let obj = objects[i];
            obj.left += offset;
            obj.top += offset;
          }
    }

    getUserData = () => {
        this.setState({
            hloader: true,
            spinMessage: "Loading T-Shirt"
        })
        let ref = this.props.firebase.database().ref('/' + this.state.url)
        let ref2 = this.props.firebase.storage().ref(this.state.url)

        // OPTION 1 -> FIREBASE REALTIME DB
        // let ref = this.props.firebase.database().ref('/' + this.props.url)
        // ref.once('value').then((snapshot) => {
        //     if(snapshot.val() == null){
                // check if authenticated user is same as url prop
            //     if(this.props.user && this.props.url == this.props.user.email.split("@")[0]) {
                    
            //         // Valid User -> Make first entry in firebase DB
            //         ref.set({
            //             username: this.props.user.displayName,
            //             email: this.props.user.email,
            //             json: "{}",
            //             edit: true
            //         });
            //     } else{
            //         alert("Invalid Tshirt")
            //         console.log("invalid")
            //     }
            // } else {
            //     this.setState({
            //         json: (snapshot.val().json == null ? {} : JSON.parse(snapshot.val().json)),
            //         username: snapshot.val().username,
            //         email: snapshot.val().email
            //     })
            // }
        //   });

        
        // OPTION 2 -> FIREBASE STORAGE BUCKET
        ref2.getDownloadURL().then((url) => {

            ref.once('value')
            .then((snapshot) => {
                this.setState({
                    username: snapshot.val().username
                })
            })
            
            axios.get(url)
            .then((response) => {
                // handle success
                let res = response.data
                // console.log("BEFORE", res.json)
                if(res.json != null){
                    this._resize(res.json.objects, res.width, res.height,this._sketch._canvas.clientWidth, this._sketch._canvas.clientHeight) 
                }
                // console.log("AFTER", res.json)

                if(res.history != null){
                    res.history.map((el) => {
                        this._resize(el.objects, res.width, res.height,this._sketch._canvas.clientWidth, this._sketch._canvas.clientHeight)
                    })
                }
                this.setState({
                    hloader: false,
                    json: (res.json == null ? {} : res.json),
                    skribblHistory: (res.history != null ? res.history: [])
                })
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                this.setState({
                    hloader: false
                })
            })
        }).catch((error)=> {
            this.setState({
                hloader: false
            })

            if(error.code == "storage/object-not-found"){
                // check if authenticated user is same as url prop
                if(this.props.user && this.state.url == this.state.email) {
                    
                    // Valid User -> Make first entry in firebase DB
                    ref.set({
                        username: this.props.user.displayName,
                        email: this.props.user.email,
                        edit: true
                    });

                    ref2.putString("{}")

                } else{
                    // alert("Invalid Tshirt")
                    this.openNotificationWithIcon("Invalid T-Shirt url", ()=>{window.location.pathname = this.state.email})
                }
            }
        })
    };

    setUserData = (json) => {
        let ref = this.props.firebase.database().ref('/' + this.state.url + '/edit')
        ref.set(true);

        let ref2 = this.props.firebase.storage().ref(this.state.url);
        ref2.putString(json);
    }

    openNotificationWithIcon = (msg, fun = ()=>{}) => {
        // notification[type]({
        //   message: 'Alert',
        //   description: msg,
        // });
        Modal.error({
            title: 'Alert',
            content: msg,
            onOk() {fun()}
          });
      };


    addJsonToTempBoard = (data, prevWidth, prevHeight) => {
        let tempJson = {}
        this._resize(data, prevWidth, prevHeight, this._sketch._canvas.clientWidth/2, this._sketch._canvas.clientHeight/2)
        this._centerAlign(data, this._sketch._canvas.clientWidth/4)
        tempJson.objects = data;
        // make the path to the center
        // tempJson.objects.map((obj) => {
        //     obj.left += (window.innerWidth)/2 - obj.left
        //     obj.top += (window.innerHeight)/2 - obj.top
        // })
        console.log("JSON", data)
        this.setState({
            tempJson,
            opacity: 0.8,
            visible: false,
            dvisible: false,
            edit: 0,
            cancelButtonDisplay: 'block'
        })
        setTimeout(()=>this._sketch2._selectAll(),1000)        
    }

    _save = () => {
        let newJson = {...this.state.json}
        
        let newSkribbl = {}
        newSkribbl.name = this.props.user.displayName
        newSkribbl.url = this.state.email
        newSkribbl.objects = this._sketch2.toJSON().objects

        let { skribblHistory} = this.state

        skribblHistory.push(newSkribbl)
        
        if(newJson.objects == null){
            newJson.objects = []
        }
        newJson.objects.push(...this._sketch2.toJSON().objects);
        this.setState({
            json: newJson,
            tempJson: {},
            opacity: 0,
            edit: 1,
            cancelButtonDisplay: 'none',
            trigger: ['click'],
            skribblHistory: skribblHistory
        })

        let serverJson = {}
        serverJson.json = newJson
        serverJson.history = skribblHistory 
        serverJson.width = this._sketch._canvas.clientWidth
        serverJson.height = this._sketch._canvas.clientHeight
        this.setUserData(JSON.stringify(serverJson))
    }

    showModal = () => {
        let ref = this.props.firebase.database().ref('/' + this.state.url + '/edit')
        ref.once('value').then((snapshot) => {
            if(snapshot.val() == true){
                this.setState({
                    visible: true,
                    trigger: []
                });
                ref.set(false);
            } else{
                // alert("Someone else is editing this. Please wait")
                this.openNotificationWithIcon("Someone else is editing this. Please wait")
            }
        }) 
    };

    setEditToTrue = () => {
        let ref = this.props.firebase.database().ref('/' + this.state.url + '/edit')
        ref.set(true)
    }
    
    handleCancel = () => {
        this.setState({ visible: false, edit: true, trigger: ['click'] });
        this.setEditToTrue();
    };

    showDrawer = () => {
        this.setState({
          dvisible: true,
        });
      };

    handleHistory = (idx) => {
        let {skribblHistory} = this.state
        let data = {}
        data.objects = skribblHistory[idx].objects
        this.setState({
            tempJson: data,
            opacity: 0.9,
            hvisible: false,
            edit: 2,
            trigger: []
        })
    }

    showHistoryDrawer = () => {
        // console.log(this.props.url, this.state.email)
        // load history if url is not same as authorized user
        if(this.state.url != this.state.email){
            window.history.pushState({}, null, this.state.email);
            this.setState({hloader: true, spinMessage: "Loading Your T-Shirt"})

            let ref = this.props.firebase.database().ref('/' + this.state.email)
            ref.once('value')
            .then((snapshot) => {
                this.setState({
                    username: snapshot.val().username
                })
            })
            
            
            let ref2 = this.props.firebase.storage().ref(this.state.email)
            ref2.getDownloadURL().then((url) => {                
                axios.get(url)
                .then((response) => {
                    // handle success
                    let res = response.data
                    // console.log("BEFORE", res.json)
                    if(res.json != null){
                        this._resize(res.json.objects, res.width, res.height,this._sketch._canvas.clientWidth, this._sketch._canvas.clientHeight) 
                    }
                    // console.log("AFTER", res.json)

                    if(res.history != null){
                        res.history.map((el) => {
                            this._resize(el.objects, res.width, res.height,this._sketch._canvas.clientWidth, this._sketch._canvas.clientHeight)
                        })
                    }
                    this.setState({
                        json: (response.data.json == null ? {} : res.json),
                        skribblHistory: (response.data.history != null ? res.history: []),
                        hvisible: true,
                        hloader: false,
                        url: this.state.email
                    })
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                })
            })
            
        } else {
            this.setState({
                hvisible: true,
                hloader: false
              });
        }
      };
    
      onClose = () => {
        this.setState({
          dvisible: false,
        });
      };

      onCloseHistoryDrawer = () => {
        this.setState({
            hvisible: false,
          });
      }

      handleClick = () => {
          if(this.state.edit == 0){
              this._save()
          } else if(this.state.edit == 2){
            this.setState({
                tempJson: {},
                opacity: 0,
                edit: 1,
                trigger: ['click'],
                hvisible: true
            })
          }
      }

      handleClickCancel = () => {
          if(this.state.edit == 0){
            this.setState({
                tempJson: {},
                opacity: 0,
                edit: 1,
                trigger: ['click'],
                cancelButtonDisplay: 'none'
            })
            this.setEditToTrue()
          }
      }

    render() {
        const shareUrl = window.location.origin + "/" +this.state.email;
        const title = "Skribbl My T-Shirt";
        let skribblHistory = this.state.skribblHistory.slice().reverse();
        // console.log(skribblHistory)
        const menu = (
            <Menu >
             <Menu.Item 
              key="1" 
              icon={<EditOutlined />} 
              onClick={this.showModal}>
                Skribbl This T-Shirt
              </Menu.Item>
              <Menu.Item 
              key="2" 
              icon={<UserOutlined />} 
              onClick={()=> window.location.pathname = this.state.email}>
                View My T-Shirt
              </Menu.Item>
              <Menu.Item 
              key="3" 
              icon={<ShareAltOutlined />} 
              onClick={this.showDrawer}>
                Share My T-Shirt
              </Menu.Item>
              <Menu.Item 
              key="4" 
              icon={<HistoryOutlined />} 
              onClick={this.showHistoryDrawer}>
                View Skribbl History
              </Menu.Item>
              <Menu.Item 
              key="5" 
              icon={<LogoutOutlined />} 
              onClick={this.props.signOut}>
                Sign Out
              </Menu.Item>
            </Menu>
          );
          

        return (
            <React.Fragment>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: this.state.edit == 2 ? 'none' : 'auto',
                    touchAction: 'auto'
                }}>
                    <SketchField
                    className="custom-canvas"
                    ref={c => (this._sketch = c)}
                    style={{
                        webkitMaskBoxImage: `url(${tshirtSVG})`,
                        webkitMaskSize: 'contain',
                        webkitMaskPostion: 'center',
                        webkitMaskRepeat: 'no-repeat',
                        backgroundColor: 'white',
                        position: 'absolute',
                        touchAction: 'auto'
                    }} 
                    width={`95vw`}
                    height={"80vh"}
                    value={this.state.json} />

                    <SketchField
                    className="custom-canvas"
                    ref={c => (this._sketch2 = c)}
                    style={{
                        webkitMaskBoxImage: `url(${tshirtSVG})`,
                        webkitMaskSize: 'contain',
                        webkitMaskPostion: 'center',
                        webkitMaskRepeat: 'no-repeat',
                        backgroundColor: 'white',
                        opacity: this.state.opacity,
                        position: 'relative',
                        touchAction: 'auto'
                    }}
                    width={`95vw`}
                    height={`80vh`}
                    tool={Tools.Select}
                    value={this.state.tempJson}/> 
                    <Spin 
                    style={{position: 'fixed'}}
                    spinning={this.state.hloader} 
                    tip={this.state.spinMessage}
                    indicator={<LoadingOutlined  spin />} 
                    />                  
                </div> 

                <Dropdown
                className="bottom-button" 
                overlay={menu} 
                trigger={this.state.trigger}>
                    <Button
                    type="primary" shape="circle"
                    style={{ height: '10vh', width: '10vh'}}
                    className='bottom-button' 
                    onClick={this.handleClick} 
                    icon={(() => {
                        if (this.state.edit == 1) {
                          return <UpOutlined style={{fontSize: '16px'}} />
                        } else if(this.state.edit == 2) {
                          return <CloseOutlined style={{fontSize: '16px'}}/>;
                        } else{
                            return <CheckOutlined style={{fontSize: '16px'}} />
                        }
                      })()}
                    size='large' />
                </Dropdown>

                {this.state.username && 
                <div className="bottom-text">
                    {this.state.username + "'s " + "T-Shirt" }
                </div>
                }
                    
                <Button
                    danger
                    type="primary" shape="circle"
                    style={{ height: '10vh', width: '10vh', display: this.state.cancelButtonDisplay}}
                    className='bottom-button-cancel' 
                    onClick={this.handleClickCancel} 
                    icon={<CloseOutlined style={{fontSize: '16px'}}  />}
                    size='large' />
                
                <Modal
                centered
                width={"90%"}
                visible={this.state.visible}
                title="Add Your Skribbl"
                onCancel={this.handleCancel}
                footer = {null}
                >
                    <SkribblBoard
                    addSkribbl = {this.addJsonToTempBoard} />
                </Modal>

                <Drawer
                title="Share Your T-Shirt"
                placement="top"
                closable={false}
                onClose={this.onClose}
                visible={this.state.dvisible}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap'
                }}
                >
                <WhatsappShareButton
                    url={shareUrl}
                    title={title}
                    separator=": "
                    className="Demo__some-network__share-button"
                >
                    <WhatsappIcon size={50} round />
                </WhatsappShareButton>
                <TelegramShareButton
                    url={shareUrl}
                    title={title}
                    className="Demo__some-network__share-button"
                >
                    <TelegramIcon size={50} round />
                </TelegramShareButton>
                <FacebookMessengerShareButton
                    url={shareUrl}
                    appId="521270401588372"
                    className="Demo__some-network__share-button"
                >
                    <FacebookMessengerIcon size={50} round />
                </FacebookMessengerShareButton>
                <FacebookShareButton
                    url={shareUrl}
                    className="Demo__some-network__share-button"
                >
                    <FacebookIcon size={50} round />
                </FacebookShareButton>
                <TwitterShareButton
                    url={shareUrl}
                    title={title}
                    className="Demo__some-network__share-button"
                >
                    <TwitterIcon size={50} round />
                </TwitterShareButton>
                <LinkedinShareButton url={shareUrl} className="Demo__some-network__share-button">
                    <LinkedinIcon size={50} round />
                </LinkedinShareButton>
                </Drawer>

                <Drawer
                title="Skribbl History"
                width={`50vw`}
                placement="right"
                closable={false}
                onClose={this.onCloseHistoryDrawer}
                visible={this.state.hvisible}
                >
                    {skribblHistory.length > 0 ? 
                    (<Timeline>
                        {skribblHistory.map((el,idx) => {
                        return (
                        <Timeline.Item>
                            <a onClick={()=> window.location.pathname = "/"+el.url}>{el.name}</a> skribbled on your T-Shirt. <a onClick={()=>this.handleHistory(skribblHistory.length-1-idx)}>view</a> 
                        </Timeline.Item>)
                    })}
                    </Timeline>)
                    : 
                    <p style={{color: 'black'}}>No Skribbls Yet :/</p>}    
                    
                </Drawer>

            </React.Fragment>
        )
    }
}

export default SketchBoard
