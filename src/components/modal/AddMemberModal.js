import React, { useContext, useState } from 'react';
import { Form, Modal, Select, Spin, Avatar } from 'antd';
import { AppContext } from '../../context/AppProvider';
import { debounce } from 'lodash';
//import { db } from '../../firebase/config';
import { editDocumentById } from '../../firebase/service';

import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';
import {  query, where, orderBy, limit} from "firebase/firestore";

//import firebase from 'firebase/app';

function DebounceSelect({
  fetchOptions,
  debounceTimeout = 300,
  curMembers,
  ...props
}) {
  // Search: abcddassdfasdf

  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]);

  const debounceFetcher = React.useMemo(() => {
    const loadOptions = (value) => {
      setOptions([]);
      setFetching(true);

      fetchOptions(value, curMembers).then((newOptions) => {
        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [debounceTimeout, fetchOptions, curMembers]);

  React.useEffect(() => {
    return () => {
      // clear when unmount
      setOptions([]);
    };
  }, []);

  return (
    <Select
      labelInValue
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size='small' /> : null}
      {...props}
    >
      {options.map((opt) => (
        <Select.Option key={opt.value} value={opt.value} title={opt.label}>
          <Avatar size='small' src={opt.photoURL}>
            {opt.photoURL ? '' : opt.label?.charAt(0)?.toUpperCase()}
          </Avatar>
          {` ${opt.label}`}
        </Select.Option>
      ))}
    </Select>
  );
}

const db = getFirestore();

async function fetchUserList(search, curMembers) {

    const userList = query(collection(db, 'person'),orderBy('name'), where('name', '>=', search?.toUpperCase()), where('name', '<=', search?.toUpperCase() + "\uf8ff"), limit(20));
    const querySnapshot = await getDocs(userList);
    return querySnapshot.docs.map((doc) => ({
      label: doc.data().name,
      value: doc.data().uid,
      photoURL: doc.data().avaURL,
    }))
    .filter((opt) => !curMembers.includes(opt.value));
    
}

export default function AddMemberModal() {
  const {
    AddMemberVisible,
    setAddMemberVisible,
    selectWorkspaceId,
    selectWorkspace,
  } = useContext(AppContext);
  const [value, setValue] = useState([]);
  const [form] = Form.useForm();

  const handleOk = () => {
    // reset form value
    form.resetFields();
    setValue([]);

    // update members in current workspcae
    

    console.log(selectWorkspace.memberIdList)
    editDocumentById('workspace', selectWorkspace.id, {
        memberIdList: [...selectWorkspace.memberIdList, ...value.map((val) => val.value)]
    })
      
    setAddMemberVisible(false);
  };

  const handleCancel = () => {
    // reset form value
    form.resetFields();
    setValue([]);

    setAddMemberVisible(false);
  };

  return (
    <div>
      <Modal
        title='Add New Member'
        visible={AddMemberVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose={true}
      >
        <Form form={form} layout='vertical'>
          <DebounceSelect
            mode='multiple'
            name='search-user'
            label='Tên các thành viên'
            value={value}
            placeholder='Enter name member'
            fetchOptions={fetchUserList}
            onChange={(newValue) => setValue(newValue)}
            style={{ width: '100%' }}
            curMembers={selectWorkspace.memberIdList}
          />
        </Form>
      </Modal>
    </div>
  );
}
