import React, { Component } from 'react'
// import {SketchField, Tools} from '../SketchField';
import {SketchField, Tools} from 'react-sketch';
import { CompactPicker } from 'react-color';
import { Tabs, Input, Button } from 'antd';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Search } = Input;

class SkribblBoard extends Component {
    constructor(props){
        super(props);

        this.state = {
            lineColor: 'black',
            fillColor: 'black',
            tool: Tools.Pencil,
            canUndo: false,
            canRedo: false,
        }
    }

    _clear = () => {
        this._sketch.clear();
        this.setState({
            canUndo: this._sketch.canUndo(),
            canRedo: this._sketch.canRedo(),
          });
    }
    
    _addSkribbl = () => {
        // this._sketch._resize(null, this.props.canvasWidth, this.props.canvasHeight);
        this.props.addSkribbl(this._sketch.toJSON().objects, this._sketch._canvas.clientWidth, this._sketch._canvas.clientHeight)
        this._sketch.clear();
    }

    _addText = (text) => {
        this._sketch.addText(text ,{
            fontSize: 20,
            fontFamily: 'Helvetica',
            fill: this.state.fillColor
          })
    }

    _undo = () => {
        this._sketch.undo();
        this.setState({
          canUndo: this._sketch.canUndo(),
          canRedo: this._sketch.canRedo(),
        });
      };
    
      _redo = () => {
        this._sketch.redo();
        this.setState({
          canUndo: this._sketch.canUndo(),
          canRedo: this._sketch.canRedo(),
        });
      };
    
      _onSketchChange = () => {
        let prev = this.state.canUndo;
        let now = this._sketch.canUndo();
        if (prev !== now) {
          this.setState({ canUndo: now });
        }
      };

    handleTabChange = (activeKey) => {
        this.setState({
            tool: (activeKey == 1 ? Tools.Pencil : Tools.Select)
        })
    }

    render() {
        return (
            <div>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
            }}>
                <SketchField
                style={{backgroundColor: "rgb(220,220,220)", padding: '0', margin: '0'}}
                name="sketch"
                width={`80vw`}
                height={"60vh"}
                ref={c => (this._sketch = c)}
                forceValue
                tool={this.state.tool}
                onChange={this._onSketchChange} 
                lineColor={this.state.lineColor}
                lineWidth={3}/>
                <div style={{flexDirection: 'row'}}>
                <Button onClick={this._undo} disabled={!this.state.canUndo} style={{margin: '2px'}} type="dashed" shape="circle" icon={<UndoOutlined />} />
                
                <Button shape="round" style={{margin: '2px'}} onClick={this._addSkribbl} type="primary">Done</Button>
                <Button shape="round" style={{margin: '2px'}} onClick={this._clear}>Clear</Button>
                
                <Button onClick={this._redo} disabled={!this.state.canRedo} style={{margin: '2px'}} type="dashed" shape="circle" icon={<RedoOutlined />} />
                </div>
                <div style={{flexDirection: 'row'}}>
                
                </div>
            </div>
            <Tabs
                tabBarStyle={{textAlign: 'center'}}
                onChange={(activeKey) => this.handleTabChange(activeKey)}
                tabPosition={'bottom'}>
                <TabPane tab="Skribbl" key="1">
                <CompactPicker
                    color={this.state.lineColor}
                    onChange={(color) => {
                        this.setState({ lineColor: color.hex })
                        }}/>
                </TabPane>
                <TabPane tab="Text" key="2">
                    <CompactPicker
                    color={this.state.fillColor}
                    onChange={(color) => this.setState({ fillColor: color.hex })}/>
                    <Search
                    style={{flex: 1}}
                    placeholder="Input Skribbl Text"
                    enterButton="Add Text"
                    size="large"
                    onSearch={value => this._addText(value)}
                    />
                </TabPane>
            </Tabs>
            
            </div>
        )
    }
}
export default SkribblBoard
