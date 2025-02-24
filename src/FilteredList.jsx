import * as XLSX from "xlsx";
function FilteredList(props) {
  var add = 0;
  var exp = 0;

  const typeFilteredData = props.data.filter((el) => {
    if (props.type === "") {
      return el;
    } else if (props.type === "Add") {
      return el.real_value >= 0;
    } else {
      return el.real_value < 0;
    }
  });

  const contentFilteredData = typeFilteredData.filter((el) => {
    if (props.input === "") {
      return el;
    } else {
      return el.content.toLowerCase().includes(props.input);
    }
  });

  contentFilteredData.forEach((transaction, index) => {
    if (transaction.real_value > 0) add += transaction.real_value;
    else exp += transaction.real_value;
  });

  props.updateExpense(exp);
  props.updateAdd(add);

  const exportData = () => {
    const now = new Date();
    const timestamp = now.toLocaleString("vi-VN");
    const worksheet = XLSX.utils.json_to_sheet(contentFilteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GHTK");
    XLSX.writeFile(workbook, props.bankTemp + "_" + timestamp + ".xlsx");
  };

  return (
    <>
      <thead>
        <tr>
          <th scope="col">STT</th>
          <th scope="col">Ngày</th>
          <th scope="col">Thông Tin</th>
          <th scope="col">Số Tiền</th>
          <button onClick={exportData} className="btn btn-info">
            <i className="fa fa-download" aria-hidden="true"></i>
          </button>
        </tr>
      </thead>
      <tbody>
        {contentFilteredData.length ? (
          contentFilteredData.map((transaction, index) => (
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td>{transaction.date}</td>
              <td className="text-start">{transaction.content}</td>

              <td className="text-end">
                {transaction.real_value < 0 ? (
                  <span className="text-right badge bg-danger text-white">
                    {transaction.value}
                  </span>
                ) : (
                  <span className="text-right badge bg-success text-white">
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
    </>
  );
}

export default FilteredList;
