import React from 'react';
import { Spin } from 'antd';
import './App.css';
import { Button } from 'antd';
import { GoogleCircleFilled } from '@ant-design/icons';
import withFirebaseAuth from 'react-with-firebase-auth'
import firebase from 'firebase';
import 'firebase/auth';
import firebaseConfig from './firebaseConfig';
import SketchBoard from './SketchBoard/SketchBoard';
import pattern from './images/pattern.svg'
import ReactGA from 'react-ga';
ReactGA.initialize('UA-171460350-1');
ReactGA.pageview(window.location.pathname);

const firebaseApp = firebase.initializeApp(firebaseConfig);

class App extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      loading: true,
      childLoading: true,
      url: window.location.pathname.split("/")[1]
    }
  }

  componentWillReceiveProps({loading}) {
    if(loading == false){
      this.setState({
        loading: false
      })
    }    
  }

  // toggleLoading = () => {
  //   let { childLoading } = this.state
  //   this.setState({
  //     childLoading: !childLoading
  //   })
  // }

  render() {
    const {
      user,
      signOut,
      signInWithGoogle,
    } = this.props;

    let { url } = this.state;
    if(user && url == ""){
      url = user.email.split("@")[0]
    }

    return (
      <div className="App">
        <div style={{backgroundImage: `url(${pattern})`}} className="background"></div>
        <div className="content">
          {
            this.state.loading ? 
            (
              <Spin spinning={this.state.loading} size={'large'}>
              </Spin>
            ) 
            : 
            (
              <div>
                {
                  user
                    ? <div>
                        <SketchBoard toggleLoading={this.toggleLoading} signOut={signOut} 
                        url={url.replace(/\./g,"_")} user = {user} firebase={firebaseApp} />
                      </div>
                    : <div>
                        <h1>Skribbl</h1>
                        <Button onClick={signInWithGoogle} size="large" shape="round" type="primary" icon={<GoogleCircleFilled />}>
                          Sign In
                        </Button>
                      </div> 
                }
              </div>
            )
          }
        </div>
        
      </div>
    );
  }
}

const firebaseAppAuth = firebaseApp.auth();

const providers = {
  googleProvider: new firebase.auth.GoogleAuthProvider(),
};

export default withFirebaseAuth({
  providers,
  firebaseAppAuth,
})(App);