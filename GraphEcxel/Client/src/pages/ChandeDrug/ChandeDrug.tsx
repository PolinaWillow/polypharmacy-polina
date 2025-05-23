import {useState, useEffect} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {Field, Form} from 'react-final-form';
import axios from 'axios'

import { useDispatch , useSelector} from 'react-redux';
import {addChandedGrapg} from '../../redux/DrugsSlice'

import Nav from '../../components/Nav/Nav'
import Button from '../../components/Button/Button'
import FileEarmarkCode from "../../assets/file-earmark-code.svg"
import Input from '../../components/Forms/Input/Input';
import Select from '../../components/Forms/Select/Select';

import chevronCompactLeft from "../../assets/chevron-compact-left.svg"

function ChandeDrug() {
    const { id } = useParams()
    //const dispatch = useDispatch()
    const navigate = useNavigate();

    const navigate_home = () => { 
        navigate('/') 
    };

    const [graphStates, setGraphStates] = useState([])
    const [file, setFile] = useState(null);
    

    useEffect(()=>{
        if(id){
            
            try {
                axios({ 
                    method: "GET", 
                    url: "/api/getstates", 
                }).then((res)=>{
                //console.log(res.data)
                setGraphStates(res.data) //Доваление в useState

                })
            } catch (err) {console.error(err)}
        }
    }, [id])

    const drug = useSelector(state=>state.drugs.chandedDrug)
    console.log(drug)
    console.log(id)
    
    const SendHandler = async (values)=>{
        const data = new FormData();
        if(file){
            data.append('file', file);
        }

        data.append('drug_name', values.drug_name)
        data.append('status', values.status)
        data.append('id', id)

        try {
        await axios({ 
            method: "POST", 
            url: "/api/update_by_id", 
            data,
            headers: { 'Content-Type': 'multipart/form-data'},
        }).then((res)=>{
            //console.log(res)
            alert(res.data.message)
            navigate('/') 
        })
        
        } catch (error) {
        console.log(error)
        }
        
        setFile(null)
    }

    // Обработчик изменения файла
    const fileChangeHandler = (e) => {
        setFile(e.target.files[0]); // Сохраняем выбранный файл в состояние
    };

    const validate = (values)=>{
    const errors={}

    if (!values.drug_name) errors.drug_name = "Пожалуйста введите название лекарственного средсва";

    if(values.graph_file){
        const fileParts: Array<string> = values.graph_file.split(".");
        if(fileParts[fileParts.length-1]!=="json") errors.graph_file_json = "Неверный формат схемы графа"
    }
    return errors;
    }

    const ScrollInto = () =>{
    let scrollElem = document.querySelector('[data-err=true]')
    if(scrollElem) {
        document.querySelector('[data-err=true]').scrollIntoView();
    }
    }


    return (
        <div className='flex'>
        <Nav isActive="instractionMark"></Nav>
        <main>
            <div>
            <Button typeBtn="Return_btn" onClick = {navigate_home}><img src={chevronCompactLeft} />Назад</Button>
            </div>

            <div  className='flex jc-center'> 
                {drug && graphStates &&
                <Form 
                onSubmit={SendHandler}
                validate={(values)=>validate(values)}
                initialValues={drug}
                >
                {({ handleSubmit, submitting}) => (
                <form onSubmit={handleSubmit}>
                    <legend>Изменить данные о лекарственном средстве</legend>
                    <Input 
                        name={"drug_name"} 
                        type={'text'} 
                        id="drug_name"
                        label='Лекарственное средство'
                    >
                    </Input>

                    {/* <Select 
                        type='formSelect' 
                        options={graphStates} 
                        name='status' 
                        id="disabledSelect"
                        label="Состояние графа"
                    ></Select> */}
                    
                    <div className="mb-4">
                        {drug.graph_file_json && 
                            <div className='mb-1'>
                                <label>Текущая схема:</label>
                                <div className='flex align-center'>
                                    <img className="icon-s me-2" alt="plusCircle" src={FileEarmarkCode}/>
                                    <span>{`${drug.graph_name}.json`}</span>
                                </div>
                            </div>
                        }
                        <label htmlFor="graph_file_json" className="form-label control-label">Выбирете новый файл с графом в формате .json:</label>
                        <input name = "graph_file_json" type="file" id="graph_file_json" className='form-control' onChange={fileChangeHandler}/>
                        
                    </div>



                    <div className='flex jc-sb'>
                        <Button typeBtn="Primary_btn" onClick={ScrollInto} disabled={submitting}>Сохранить изменения</Button>
                        <Button typeBtn="Light_btn" onClick={navigate_home} disabled={submitting}>Отменить изменения</Button>
                    </div>
                    
                </form>
                )}
                </Form>
                }
            </div>
        </main>
        </div>
    )
}

export default ChandeDrug
