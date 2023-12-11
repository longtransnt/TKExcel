import { useState } from "react";
import { read, utils } from "xlsx";
import * as XLSX from "xlsx";

import { Form, Container, Row, Col } from "react-bootstrap";

const IncomeView = () => {
  // LEGACY BLOAT
  const [income, setIncome] = useState(0);
  const [spending, setSpending] = useState(0);
  const [data, setData] = useState([]);
  const [bankFormat, setBankFormat] = useState("");
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [currentFile, setCurrentFile] = useState(null);
  const [deliveryList, setDeliveryList] = useState([]);
  const now = new Date();
  const timestamp = now.toLocaleString("vi-VN");

  const formatTransaction = (transactions) => {
    transactions.forEach(function (transaction) {
      var delivery = transaction["Mã ĐH"].split(".");
      var customer = transaction["Thông tin khách hàng"].split("-");
      const customer_name = customer[0];
      const address = customer[1];
      const phone = transaction["Số điện thoại khách hàng"];
      const money_cod = transaction["Giá trị hàng hóa"];
      const delivery_code = delivery[delivery.length - 1];
      const phone2 = phone;
      const delivery_code2 = delivery_code;
      const url = "https://i.ghtk.vn/" + delivery_code;
      // console.log({ delivery_code, phone, customer_name, address, money_cod });
      deliveryList.push({
        phone,
        customer_name,
        delivery_code,
        phone2,
        money_cod,
        address,
        delivery_code2,
        url,
      });
    });
    // console.log(deliveryList);
    // console.log(timestamp);

    const worksheet = XLSX.utils.json_to_sheet(deliveryList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GHTK");
    XLSX.writeFile(workbook, "GHTK_Ship_" + timestamp + ".xlsx");
  };

  const handleFileChange = ($event) => {
    setCurrentFile($event.target.files);
  };

  const handleImport = () => {
    if (currentFile.length) {
      const file = currentFile[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = read(event.target.result);
        const sheets = wb.SheetNames;

        if (sheets.length) {
          const rows = utils.sheet_to_json(wb.Sheets[sheets[0]]);
          if (bankFormat === "VCB") {
            rows.splice(0, 10);
          } else if (bankFormat === "VTB") {
            rows.splice(0, 3);
          } else if (bankFormat === "SCB") {
            rows.splice(0, 22);
          }
          formatTransaction(rows);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    setDeliveryList([]);
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="4">
            <label>Chọn format xlsx từ ngân hàng: </label>
            <Form.Control
              as="select"
              value={bankFormat}
              onChange={(e) => {
                setBankFormat(e.target.value);
              }}
            >
              <option defaultValue=""></option>
              <option value="VCB">Vietcombank</option>
              <option value="SCB">Sacombank</option>
            </Form.Control>
            <br />
          </Col>
          <Col className="pr-1" md="4">
            <label>Ngày Đầu</label>
            <Form.Control
              type="date"
              onChange={(e) => {
                setDate1(e.target.value);
              }}
              value={date1}
            />
          </Col>
          <Col className="pr-1" md="4">
            <label>Ngày Cuối</label>
            <Form.Control
              type="date"
              onChange={(e) => {
                setDate2(e.target.value);
              }}
              value={date2}
            />
          </Col>
          <Col className="pr-1" md="3">
            <div className="input-group">
              <div className="custom-file">
                <input
                  type="file"
                  name="file"
                  className="custom-file-input"
                  id="inputGroupFile"
                  required
                  onChange={handleFileChange}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
              </div>
            </div>
          </Col>

          <Col>
            <div>Tổng Số Tiền Thu Được:</div>
            <span
              style={{
                color: "green",
                fontWeight: "bold",
              }}
            >
              {Number(income).toLocaleString("vi-VN")} VND
            </span>
          </Col>

          <Col>
            <div>Tổng Số Tiền Chi Ra:</div>
            <span
              style={{
                color: "red",
                fontWeight: "bold",
              }}
            >
              {Number(spending).toLocaleString("vi-VN")} VND
            </span>
          </Col>
          <Col>
            <span>
              <button
                onClick={handleImport}
                className="btn btn-primary float-right"
              >
                Tải lại <i className="fa fa-refresh"></i>
              </button>
            </span>
          </Col>
        </Row>
        <Row>
          <div className="row">
            <div className="col-sm-12 ">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">STT</th>
                    <th scope="col">Ngày</th>
                    <th scope="col">Thông Tin</th>
                    <th scope="col">Số Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length ? (
                    data.map((transaction, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td>{transaction.date}</td>
                        <td>{transaction.content}</td>

                        <td>
                          {transaction.real_value < 0 ? (
                            <span className="badge bg-danger text-white">
                              - {transaction.value}
                            </span>
                          ) : (
                            <span className="badge bg-info text-white">
                              {transaction.value}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        Chưa có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Row>
      </Container>
    </>
  );
};

export default IncomeView;
