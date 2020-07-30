/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */

figma.showUI(__html__, {
  width: 300,
  height: 400,
});

let groupsData: {
  name: string,
  nodes: any,
  isVisible: boolean
  showList: boolean
}[] = [];

const setData = (data) => {
  figma.currentPage.setPluginData('group&hide_data', JSON.stringify(data));
};

const getData = () => {
  const data = figma.currentPage.getPluginData('group&hide_data');
  return data === '' ? [] : JSON.parse(data);
};

const updateGroups = (data) => {
  figma.ui.postMessage({ type: 'UPDATE_GROUPS', data });
  setData(data);
};

const updateGroupsContent = () => {
  const data = getData();
  const indicesList = [];
  if (data.length) {
    for (const [groupIndex, group] of data.entries()) {
      if (group.nodes.length) {
        for (const [nodeIndex, node] of group.nodes.entries()) {
          const foundNode = figma.currentPage.findOne((n) => n.id === node.id);
          if (foundNode) {
            if (foundNode.name !== node.name) {
              data[groupIndex].nodes[nodeIndex].name = foundNode.name;
              updateGroups(data);
            }
          } else {
            indicesList.push({
              groupIndex,
              nodeId: node.id,
            });
          }
        }
      }
    }

    if (indicesList.length) {
      for (const incides of indicesList) {
        const { groupIndex, nodeId } = incides;
        const filtered = data[groupIndex].nodes.filter((node) => node.id !== nodeId);
        data[groupIndex].nodes = filtered;
      }
      updateGroups(data);
    }
  }
};

const init = () => {
  const data = getData();
  figma.ui.postMessage({ type: 'UPDATE_GROUPS', data });
  updateGroupsContent();
};

figma.ui.onmessage = (msg) => {
  const { type } = msg;

  if (type === 'CREATE_GROUP') {
    setData(msg.data);
  } else if (type === 'ADD_NODE') {
    const { index } = msg;
    groupsData = getData();

    for (const node of figma.currentPage.selection) {
      if (groupsData[index].nodes.every((item) => item.id !== node.id)) {
        groupsData[index].nodes.push({ name: node.name, id: node.id });
      }
    }

    groupsData[index].showList = true;
    updateGroups(groupsData);
  } else if (type === 'TOGGLE_VISIBILITY') {
    const { index } = msg;
    updateGroupsContent();

    groupsData = getData();
    const { nodes, isVisible } = groupsData[index];

    if (nodes.length) {
      for (const node of nodes) {
        figma.currentPage.findOne((item) => item.id === node.id).visible = !isVisible;
      }

      groupsData[index].isVisible = !isVisible;
      updateGroups(groupsData);
    }
  } else if (type === 'REMOVE_NODE') {
    const { index, nodeIndex } = msg;
    groupsData = getData();

    groupsData[index].nodes.splice(nodeIndex, 1);

    updateGroups(groupsData);
  } else if (type === 'DELETE_GROUP') {
    const { index } = msg;

    groupsData = getData();
    groupsData.splice(index, 1);
    updateGroups(groupsData);
  } else if (type === 'CLEAR_GROUP') {
    const { index } = msg;
    groupsData = getData();

    groupsData[index].nodes = [];
    groupsData[index].isVisible = true;
    groupsData[index].showList = true;
    updateGroups(groupsData);
  } else if (type === 'UPDATE_GROUPS') {
    const { data } = msg;
    updateGroups(data);
  }
};

init();
