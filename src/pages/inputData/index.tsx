import React, { useState, useEffect, createRef } from 'react';
import currentStyles from './index.module.scss';
import { UploadStatus } from '../../constants/upload';
import type { UploadProps } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import type { UploadFile } from 'antd/es/upload/interface';
import commonController from "../../utils/common/common";
import { uploadFile as uploadFileService } from "../../services/createTask";
import { Tree } from 'antd';
import {useSelector, useDispatch} from "react-redux";
import { updateNewSamples } from '../../stores/sample.store';
import NativeUpload from '../../components/nativeUpload'
let newFileList : any[] = [];
let newFileListInfo : any[] = [];
let newFolder : any = {};
let saveFolderFiles : any[] =[];
const InputInfoConfig = ()=>{
    const { DirectoryTree } = Tree;
    const dispatch = useDispatch();
    let configStep = useSelector(state=>state.existTask.configStep );
    let haveConfigedStep =  useSelector(state=>state.existTask.haveConfigedStep );
    let taskName = useSelector(state=>state.existTask.taskName );
    let taskDescription = useSelector(state=>state.existTask.taskDescription );
    let taskTips = useSelector(state=>state.existTask.taskTips );
    let taskId = useSelector(state=>state.existTask.taskId );
    const [uploadedTotal, setUploadedTotal] = useState(0);
    const [uploadedSuccessful, setUploadedSuccessful] = useState(0);
    const [uploadedFailed, setUploadedFailed] = useState(0);

    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const [haveUploadFiles, setHaveUploadFiles] = useState<any[]>([]);
    const handleChange : UploadProps['onChange'] = (info)=>{
        let newFileList1 = [...info.fileList];
        newFileList = newFileList1;
    }



    const inputRef = createRef<any>();

    const [flag, setFlag] = useState(true);


    const customRequest = (v:any)=>{
    }
    const uploadFileChange = (k:any)=>{
    }
    const items = [{
        fileName : 'test1.txt',
        status : 0,
        option : ()=>{
        }
    }];
    const isCorrectFiles = (files : any)=>{
        let result = true;
        if (files.length > 100) {
          commonController.notificationErrorMessage({message : '单次上传文件数量超过上限100个，请分批上传'}, 3);
            return;
        }
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            let fileUnit = files[fileIndex];
            let isOverSize = commonController.isOverSize(fileUnit.size);
            if(isOverSize) {
              commonController.notificationErrorMessage({message : '单个文件大小超过100MB限制'}, 3);
                result = false;
                break;
            }
            let isCorrectFileType = commonController.isCorrectFileType(fileUnit.name);
            if(!isCorrectFileType) {
              commonController.notificationErrorMessage({message : '请上传支持的文件类型，类型包括：jpg、png、bmp、gif'}, 3);
              result = false;break;}
        }
        return result;
    }
    const updateOneOfHaveUplodaedFileList = (uid : any, hasUploaded : any, result : any)=>{
        let temp = haveUploadFiles.concat([]);
        for (let haveUploadedFilesIndex = 0; haveUploadedFilesIndex < temp.length; haveUploadedFilesIndex++) {
            let haveUploadedFile = temp[haveUploadedFilesIndex];
            if (uid === haveUploadedFile.uid){
                haveUploadedFile.hasUploaded = hasUploaded;
                if (result) {
                  haveUploadedFile.uploadId = result?.data.data.id;
                  haveUploadedFile.url = result.data.data.url;
                  haveUploadedFile.id = result.data.data.id;
                }
                setHaveUploadFiles(temp);
                break;
            }
        }
    }
    const addToHaveUploadFilesList = (currentNewFileList : any)=>{
      let currentListContainer = [];
      for (let currentNewFileListIndex = 0; currentNewFileListIndex < currentNewFileList.length; currentNewFileListIndex++) {
          let currentInfo =  currentNewFileList[currentNewFileListIndex];
          currentListContainer.push({
              name : currentInfo.name,
              size : currentInfo.size,
              hasUploaded : UploadStatus.WAITING,
              params : {
                  path : currentInfo.webkitRelativePath === '' ? './' : currentInfo.webkitRelativePath,
                  file : currentInfo
              },
              uid : uuidv4()
          });
      }
      setHaveUploadFiles(haveUploadFiles.concat(currentListContainer))
      // saveFolderFiles = saveFolderFiles.concat(currentListContainer);
      setTemp(currentListContainer.concat());
    }
    const [startToUpload, setStartToUpload] = useState(1);
    const [temp,setTemp] = useState<any>([]);
    const [tempC,setTempC] = useState<any>(0);
    const [startUploadFlag, setStartUploadFlag] = useState(false);
    const upLoadFiles = async function () {
        setStartUploadFlag(true);
        let tempSuccessful = 0;
        let tempFailed = 0;
        // console.log(temp);
        for (let newFileListInfoIndex = 0; newFileListInfoIndex < temp.length; newFileListInfoIndex++) {
            let currentInfo =  temp[newFileListInfoIndex];
            let result = undefined;
            // if (path.indexOf('/') > -1)
            {
                result = await uploadFileService(taskId, {  file : currentInfo.params.file  });
                setTempC(newFileListInfoIndex + 1);
                if (result?.status === 201) {
                    tempSuccessful = tempSuccessful + 1;
                    setUploadedSuccessful(uploadedSuccessful + 1);
                    updateOneOfHaveUplodaedFileList(currentInfo.uid, UploadStatus.SUCCESS, result);
                }else{
                    tempFailed = tempFailed + 1;
                    updateOneOfHaveUplodaedFileList(currentInfo.uid, UploadStatus.FAIL, undefined);
                }
            }
        }
        setStartUploadFlag(false);
        setTemp([]);
        setTimeout(()=>{
          if (tempFailed === 0 && tempSuccessful > 0) {
            commonController.notificationSuccessMessage({message : tempSuccessful + '个文件上传成功'},3);
          }
          if (tempFailed > 0 && tempSuccessful > 0) {
            commonController.notificationWarnMessage({message : `${tempSuccessful}个文件上传成功, ${tempFailed}个文件上传失败`},3);
          }
        },1000);
    }
    useEffect(()=>{
        if (startToUpload === 1) {
            return;
        }else{
            upLoadFiles().catch((error:any) => commonController.notificationErrorMessage(error,3));
        }
    },[startToUpload]);

    const deleteSingleFile = (itemIndex : number)=>{
       const tempArr = Object.assign([],haveUploadFiles);
       tempArr.splice(itemIndex,1);
       commonController.notificationSuccessMessage({message : '删除成功'},1)
       setDeleteTag(true);
       setHaveUploadFiles(tempArr);
    }
    const renewUpload = async function(item : any, itemIndex : number){
        let result = await uploadFileService(taskId, item.params);
        let temp : any= Object.assign([],haveUploadFiles);
        if (result?.status === 201) {
          temp[itemIndex].hasUploaded = UploadStatus.SUCCESS;
          commonController.notificationSuccessMessage({message : '一个文件上传成功'}, 2);
        }else{
          temp[itemIndex].hasUploaded = UploadStatus.FAIL;
          commonController.notificationSuccessMessage({message : '一个文件上传失败'}, 2);
        }
        setHaveUploadFiles(temp);
    }
    const updateUploadedFiles = ()=>{
        let result = [];
        for (let fileIndex = 0; fileIndex < haveUploadFiles.length; fileIndex++ ) {
            let fileItem = haveUploadFiles[fileIndex];
            if(fileItem.id || fileItem === 0){
                let newItem = {
                    attachement_ids : [fileItem.id],
                    data : {
                        result : '{}',
                        urls : {[fileItem.id] : fileItem.url},
                        fileNames : {[fileItem.id] : ''}
                    }
                }
                result.push(newItem);
            }
        }
        dispatch(updateNewSamples(result))
    }
    const [deleteTag, setDeleteTag] = useState(false);
    useEffect(()=>{
      updateUploadedFiles();
      if(deleteTag) {setDeleteTag(false);return};
        let successfulFiles = 0;
        let failedFiles = 0;
        for (let haveUploadFile of haveUploadFiles) {
            if (haveUploadFile.hasUploaded === UploadStatus.SUCCESS) {
                successfulFiles = successfulFiles + 1;
            }else{
                failedFiles = failedFiles + 1;
            }
        }
        setUploadedSuccessful(successfulFiles);
        setUploadedFailed(failedFiles);
    },[haveUploadFiles]);

    const inputFolder = (files : any)=>{
      let isCorrectCondition = isCorrectFiles(files);
      if(!isCorrectCondition){
         return;
      }else{
        commonController.notificationSuccessMessage({message : '已添加'+ files.length + '个项目至上传列表'},3);
      }
      // setTemp(files);
      addToHaveUploadFilesList(files);
      setStartToUpload(startToUpload + 1);
    }
    return (<div className = {currentStyles.outerFrame}>
        <div className = {currentStyles.title}>
            <div className={currentStyles.icon}></div>
            <div className = {currentStyles.titleText}>数据导入</div>
        </div>
        <div className = {currentStyles.content}>
            <div className = {currentStyles.left}>
                <div className = {currentStyles.leftTitle}>本地上传</div>
                <div className = {currentStyles.dragAndDrop}>
                    <div className = { currentStyles.survey }></div>
                    <div className = { currentStyles.buttons }>
                        <div className = { currentStyles.uploadFileButton }>
                            <NativeUpload onChange={ inputFolder } directory={false} multiple={true} accept={'image/png,image/jpeg,image/bmp,image/gif'}>
                                <div className={currentStyles.buttonDiv}>
                                    <img src="/src/icons/uploadFile.svg" alt=""/>
                                    <div style = {{display : 'inline-block', color : '#FFFFFF'}}>上传文件</div>
                                </div>
                            </NativeUpload>
                        </div>
                        <div className = { currentStyles.uploadFolderButton }>
                            <NativeUpload onChange={ inputFolder } directory={true}  accept={'image/jpg,image/jpeg,image/bmp,image/gif'}>
                                <div className={currentStyles.buttonDiv}>
                                    <img src="/src/icons/uploadFolder.svg" alt=""/>
                                    <div style = {{display : 'inline-block', color : '#1b67ff'}}>上传文件夹</div>
                                </div>
                            </NativeUpload>

                        </div>
                    </div>
                    <div className= { currentStyles.illustration }>
                        <div className = { currentStyles.supportType }>&nbsp;支持文件类型包括：jpg、png、bmp、gif
                        </div>
                        <div className = { currentStyles.advises }> 单次上传文件最大数量为100个，建议单个文件大小不超过100MB </div>
                    </div>

                    {/*<div style = {{display : 'inline-block', color : '#1b67ff'}}>*/}
                    {/*    <input type="file" multiple ref = {inputRef} onChange = {inputFolder}/>*/}
                    {/*</div>*/}


                    <div>
                    </div>
                </div>
            </div>
            <div className={currentStyles.right}>
                {startUploadFlag && temp.length > 0 && <div className={currentStyles.rightTitle}>
                    <div className = {currentStyles.rightTitleLeft}>上传列表</div>
                    {/*<div className = {currentStyles.rightTitleRight}>正在上传&nbsp;*/}
                    {/*    <div  className = {currentStyles.rightTitleRightHight}>10</div>*/}
                    {/*    /30&nbsp;个文件</div>*/}
                    <div>正在上传</div>
                    <div>&nbsp;&nbsp;
                        <div style = {{display : 'inline-block',color : '#1b67ff'}}>{ tempC }</div>
                        /</div>
                    <div>
                        <div style = {{display : 'inline-block',color : 'black'}}>{ temp.length }</div>
                        个文件</div>
                </div>}
                {!startUploadFlag &&haveUploadFiles.length > 0 && <div className={currentStyles.rightTitle}>
                    <div className = {currentStyles.rightTitleLeft}>上传列表</div>
                    {/*<div className = {currentStyles.rightTitleRight}>正在上传&nbsp;*/}
                    {/*    <div  className = {currentStyles.rightTitleRightHight}>10</div>*/}
                    {/*    /30&nbsp;个文件</div>*/}
                    <div>已上传
                        { haveUploadFiles.length }
                        个文件,</div>
                    <div>&nbsp;&nbsp;上传成功
                        <div style = {{display : 'inline-block',color : '#00B365'}}>{ uploadedSuccessful }</div>
                        个,</div>
                    <div>&nbsp;&nbsp;上传失败
                        <div style = {{display : 'inline-block',color : '#f5483B'}}>{ uploadedFailed }</div>
                        个</div>
                </div>}
                <div className={currentStyles.rightContent}>
                  {/*<Table columns = {columns}*/}
                  {/*       dataSource={haveUploadFiles ? haveUploadFiles: []}*/}
                  {/*       pagination={false}*/}
                  {/*       // loading = {dataLoading}*/}
                  {/*       // rowKey = {record=>record.id}*/}
                  {/*       // rowSelection = { rowSelection }*/}
                  {/*       // onRow = {onRow}*/}
                  {/*       // onChange={reactSorter}*/}
                  {/*></Table>*/}

                    <div className = {currentStyles.columnsName}>
                        <div className = {currentStyles.columnFileName}  style={{color : 'rgba(0, 0, 0, 0.6)'}}>文件名</div>
                        <div className = {currentStyles.columnFileName}  style={{color : 'rgba(0, 0, 0, 0.6)'}}>地址</div>
                        <div className = {currentStyles.columnStatus}  style={{color : 'rgba(0, 0, 0, 0.6)'}}>状态</div>
                        <div className = {currentStyles.columnOption} style={{color : 'rgba(0, 0, 0, 0.6)'}}>操作</div>
                    </div>
                    <div className={currentStyles.columnsContent}>
                        <br/>



                        {haveUploadFiles && haveUploadFiles.length > 0 && haveUploadFiles.map((item : any, itemIndex : number)=>{
                            // console.log( item );
                            if (item.children) {
                                return (<div className = {currentStyles.folderItem}>
                                    <DirectoryTree
                                        multiple
                                        selectable={false}
                                        treeData = {[item]}
                                    />
                                </div>)
                            }else{
                                return (<div className = {currentStyles.item} key = {item.uid}>
                                    <div className = {currentStyles.columnFileName}><img src='/src/icons/file.svg' />&nbsp;&nbsp;{item.name}</div>
                                    <div className = {currentStyles.columnFileName}>&nbsp;&nbsp;&nbsp;&nbsp;{item.params.path}</div>
                                    <div className = {currentStyles.columnStatus}>&nbsp;&nbsp;{item.hasUploaded === UploadStatus.UPLOADING ?
                                        (<div className={currentStyles.uploadStatus}><img src="/src/icons/pending.png" alt=""/>上传中</div>) :
                                        (item.hasUploaded === UploadStatus.WAITING ? (<div className={currentStyles.uploadStatus}><img src="/src/icons/pending.png" alt=""/>等待中</div>) :
                                            (item.hasUploaded === UploadStatus.SUCCESS ? (<div className={currentStyles.uploadStatus}><div className={currentStyles.greenCircle}></div>上传成功</div>) :
                                                    (<div className={currentStyles.uploadStatus}><div className={currentStyles.redCircle}></div>上传失败</div>)
                                            )
                                        )
                                        }</div>
                                    <div className = {currentStyles.columnOptionButtons}>
                                        {item.hasUploaded === UploadStatus.FAIL && <div className = {currentStyles.columnOption1}
                                        onClick = {()=>renewUpload(item, itemIndex)}> 重新上传 </div>}
                                        <div className = {currentStyles.columnOption}
                                             onClick = { ()=>deleteSingleFile(itemIndex) }
                                        >删除</div>
                                    </div>

                                </div>)
                            }

                        })}
                    </div>

                </div>
            </div>
        </div>
    </div>)
}
export  default InputInfoConfig;

