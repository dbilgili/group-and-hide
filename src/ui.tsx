/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-restricted-globals */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './styles.sass';
import Show from './icons/visible.svg';
import Cross from './icons/cross.svg';
import DownArrow from './icons/downArrow.svg';
import UpArrow from './icons/upArrow.svg';
import Add from './icons/add.svg';
import Clear from './icons/clear.svg';
import Delete from './icons/delete.svg';
import GroupIcon from './icons/groupIcon.svg';

interface Props {
}

interface State {
  groupNameField: string,
  isGroupNameInvalid: boolean,
  activeGroups: {
    name: string,
    nodes: any,
    isVisible: boolean,
    showList: boolean
  }[],
}

class App extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      groupNameField: '',
      isGroupNameInvalid: false,
      activeGroups: [],
    };
  }

  componentDidMount() {
    window.onmessage = (msg) => {
      const { type, data } = msg.data.pluginMessage;

      if (type === 'UPDATE_GROUPS') {
        this.setState({
          activeGroups: data,
        });
      }
    };

    const { body } = document;

    body.addEventListener('mousedown', () => {
      if (!body.classList.contains('mouse')) {
        body.classList.add('mouse');
      }
    });

    body.addEventListener('keydown', (e) => {
      if (body.classList.contains('mouse') && e.key === 'Tab') {
        body.classList.remove('mouse');
      }
    });
  }

  handleInput = (e) => {
    const { isGroupNameInvalid } = this.state;

    if (isGroupNameInvalid) {
      this.setState({
        isGroupNameInvalid: false,
        groupNameField: e.target.value,
      });
    } else {
      this.setState({ groupNameField: e.target.value });
    }
  }

  handleEnter = (e) => {
    if (e.key === 'Enter') {
      this.createGroup();
    }
  }

  createGroup = () => {
    const { groupNameField, activeGroups } = this.state;

    if (groupNameField.length) {
      const isValid = activeGroups.every((group) => group.name !== groupNameField);
      if (isValid) {
        const temp = [...activeGroups, {
          name: groupNameField,
          nodes: [],
          isVisible: true,
          showList: true,
        }];

        this.setState({
          activeGroups: temp,
          groupNameField: '',
        });
        parent.postMessage({
          pluginMessage:
          {
            type: 'CREATE_GROUP',
            data: temp,
          },
        }, '*');
      } else {
        this.setState({ isGroupNameInvalid: true });
      }
    }
  }

  addNode = (index) => {
    parent.postMessage({
      pluginMessage:
      {
        type: 'ADD_NODE',
        index,
      },
    }, '*');
  }

  removeNode = (index, nodeIndex) => {
    parent.postMessage({
      pluginMessage:
      {
        type: 'REMOVE_NODE',
        index,
        nodeIndex,
      },
    }, '*');
  }

  clearGroup = (index) => {
    parent.postMessage({
      pluginMessage:
      {
        type: 'CLEAR_GROUP',
        index,
      },
    }, '*');
  }

  deleteGroup = (index) => {
    parent.postMessage({
      pluginMessage:
      {
        type: 'DELETE_GROUP',
        index,
      },
    }, '*');
  }

  toggleVisibility = (index) => {
    parent.postMessage({
      pluginMessage:
      {
        type: 'TOGGLE_VISIBILITY',
        index,
      },
    }, '*');
  }

  toggleList = (index) => {
    const { activeGroups } = this.state;

    if (activeGroups[index].nodes.length) {
      const temp = [...activeGroups];
      temp[index].showList = !temp[index].showList;

      this.setState({ activeGroups: temp }, () => {
        parent.postMessage({
          pluginMessage:
          {
            type: 'UPDATE_GROUPS',
            data: temp,
          },
        }, '*');
      });
    }
  }

  render() {
    const { activeGroups, isGroupNameInvalid, groupNameField } = this.state;

    return (
      <div className="wrapper">
        <div className="inputFieldWrapper">
          {isGroupNameInvalid && <div className="invalidGroupName">Group name is in use</div>}
          <input
            value={groupNameField}
            className="inputField"
            placeholder="Group name"
            onChange={this.handleInput}
            onKeyUp={this.handleEnter}
          />
          <button
            type="button"
            className="createButton"
            onClick={this.createGroup}
          >
            Create
          </button>
        </div>
        {
          activeGroups.length
            ? (
              activeGroups.map((group, index) => (
                <div
                  key={group.name}
                  className="groupWrapper"
                >
                  <div className="groupTitle">
                    <button
                      type="button"
                      className="toggleButton iconButton"
                      onClick={() => this.toggleVisibility(index)}
                    >
                      <Show className={`${group.isVisible ? 'visible' : 'invisible'}`} />
                    </button>
                    <button
                      type="button"
                      className="expandButton iconButton"
                      onClick={() => this.toggleList(index)}
                    >
                      <span className={`groupName ${group.isVisible ? 'visible' : 'invisible'}`}>
                        {`(${group.nodes.length}) ${group.name}`}
                      </span>
                      {
                      group.showList
                        ? <UpArrow />
                        : <DownArrow />
                    }
                    </button>
                    <span className="separator">|</span>
                    <div className="controlButtons">
                      <button
                        type="button"
                        className="addButton iconButton controlButton"
                        onClick={() => this.addNode(index)}
                      >
                        <Add />
                      </button>
                      <button
                        type="button"
                        className="clearButton iconButton controlButton"
                        onClick={() => this.clearGroup(index)}
                      >
                        <Clear />
                      </button>
                      <button
                        type="button"
                        className="deleteButton iconButton controlButton"
                        onClick={() => this.deleteGroup(index)}
                      >
                        <Delete />
                      </button>
                    </div>
                  </div>
                  {
                  group.showList && (
                    <div className="nodeList">
                      {group.nodes.map((node, nodeIndex) => (
                        <div
                          key={node.id}
                          className="node"
                        >
                          <button
                            type="button"
                            className="deleteButton iconButton"
                            onClick={() => this.removeNode(index, nodeIndex)}
                          >
                            <Cross />
                          </button>
                          <span className="nodeName">{node.name}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                </div>
              ))
            )
            : (
              <div className="noGroup">
                <GroupIcon />
                <span>Create a group to add items</span>
              </div>
            )
        }
        <br />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('react-page'));
