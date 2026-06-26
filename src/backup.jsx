// ============================Script variables============================
// IDs belong to documentation files
const REPORT_FILE_ID = "1s7OWNkKcuXagQfICKPFWvoMpw2H8m3I1jt7_zA1IIWE";
const ACCOUNTING_FILE_ID = "1LnRP3-VMr6FTB2bxi7_xp0x6RwMruNuTZV7kobLqBrU";
const PAWN_FILE_ID = "15Dr2HnnzncZx_WEpC7x641NalHBAFo8M19Zg4-A8c3s";
const BALANCE_FILE_ID = "1AoMrFjAFa2O5OXKeGPDvNnHsKSFDihV3rENrUqipJTU";
const DEFAULT_OFFSET = 27;

// @updateSpecifiedData: Update value for specific date function
// const date = "25.12.23";
// const destinationRange = "H4403:T4418";
// const startingRange = "A1:M16";
// const sourceFile = BALANCE_FILE_ID;

// ============================Script functions============================
function updateSpecifiedData() {
  var sourceSpreadsheet = SpreadsheetApp.openById(sourceFile);
  var destSpreadsheet = SpreadsheetApp.openById(REPORT_FILE_ID);
  var sheet = sourceSpreadsheet.getSheetByName(date);
  var destSheet = destSpreadsheet.getActiveSheet();
  copySheetDataFormRange(sheet, destSheet, startingRange, destinationRange);
}

// ============================Stable functions============================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("Chức Năng Thêm");
  menu.addItem("Kiểm sổ Thu Ngân (Ngọc)", "checkAccounting");
  menu.addItem("Kiểm sổ Cầm Đồ (Hà)", "checkAccounting");
  menu.addToUi();
}

function setScheduleEveryday() {
  ScriptApp.newTrigger("checkAccounting").timeBased().everyDays(1).create();
  ScriptApp.newTrigger("checkPawn").timeBased().everyDays(1).create();
}

function copySheetDataFormRange(sourceSheet, destSheet, range, destRange) {
  var dataRange = sourceSheet.getRange(range);
  var data = dataRange.getValues();
  var targetCells = destSheet.getRange(destRange);
  targetCells.setValues(data);
  targetCells.setBorder(
    true,
    true,
    true,
    true,
    false,
    true,
    "black",
    SpreadsheetApp.BorderStyle.SOLID_MEDIUM
  );
  return destRange;
}

function processHistoryTabs(
  destSheet,
  incrRange,
  sheet,
  destSpreadsheet,
  startingRange,
  i
) {
  if (destSheet.getRange(incrRange).isBlank()) {
    copySheetDataFormRange(sheet, destSpreadsheet, startingRange, incrRange);
  } else {
    const invalidDate = compareSheetDataFromRange(
      sheet,
      destSheet,
      startingRange,
      incrRange,
      i,
      false
    );
    if (invalidDate != null) {
      Logger.log("Invalid Date: " + invalidDate);
      // if (!changeDatesCell.getValues().includes(invalidDate))
      //   changeDates.push(invalidDate);
      // hasChanges = true;
    }
  }
}

function checkPawn() {
  var sourceSpreadsheet = SpreadsheetApp.openById(PAWN_FILE_ID);
  var destSpreadsheet = SpreadsheetApp.openById(REPORT_FILE_ID);
  var sheets = sourceSpreadsheet.getSheets();
  var destSheet = destSpreadsheet.getActiveSheet();
  var startingRange = "A1:G18";
  var incrRange = "J2:P19";
  var outputCell = "J1";
  var outputChangeDates = "K1";
  result = destSheet.getRange(outputCell);
  var hasChanges = false;
  var changeDatesCell = destSheet.getRange(outputChangeDates);
  var changeDates = changeDatesCell.getValue().split(" -");
  for (let i = sheets.length - 1; i > 1; i--) {
    if (!isNaN(i)) {
      var sheet = sheets[i];
      if (i == 2) {
        copySheetDataFormRange(
          sheet,
          destSpreadsheet,
          startingRange,
          incrRange
        );
      }
      // Else compare the previous pages
      else {
        processHistoryTabs(
          destSheet,
          incrRange,
          sheet,
          destSpreadsheet,
          startingRange,
          i
        );
      }
    }
    incrRange = add27ToRow(incrRange);
  }
  if (hasChanges) {
    result.setValue("SỔ LIỆU ĐÃ ĐỔI");
    result.setBackground("red");
    changeDatesCell.setValue(changeDates.join(" -"));
  } else {
    result.setValue("SỔ LIỆU KO ĐỔI");
    result.setBackground("lime");
    changeDatesCell.setValue("");
  }
}

function checkAccounting() {
  var sourceSpreadsheet = SpreadsheetApp.openById(ACCOUNTING_FILE_ID);
  var destSpreadsheet = SpreadsheetApp.openById(REPORT_FILE_ID);
  var sheets = sourceSpreadsheet.getSheets();
  var destSheet = destSpreadsheet.getActiveSheet();
  var startingRange = "A2:H24";
  var outputCell = "A1";
  var outputChangeDates = "B1";
  var incrRange = startingRange;
  result = destSheet.getRange(outputCell);
  var hasChanges = false;
  var changeDatesCell = destSheet.getRange(outputChangeDates);
  var changeDates = changeDatesCell.getValue().split(" -");

  for (var i = 150; i < sheets.length; i++) {
    var sheet = sheets[i];
    // Update the latest page
    if (i == sheets.length - 1) {
      copySheetDataFormRange(sheet, destSpreadsheet, startingRange, incrRange);
    }
    // Else compare the previous pages
    else {
      processHistoryTabs(
        destSheet,
        incrRange,
        sheet,
        destSpreadsheet,
        startingRange,
        i
      );
    }
    incrRange = add27ToRow(incrRange);
  }
  if (hasChanges) {
    result.setValue("SỔ LIỆU ĐÃ ĐỔI");
    result.setBackground("red");
    changeDatesCell.setValue(changeDates.join(" -"));
  } else {
    result.setValue("SỔ LIỆU KO ĐỔI");
    result.setBackground("lime");
    changeDatesCell.setValue("");
  }
}

function copySheetDataFormRange(sourceSheet, destSheet, range, destRange) {
  var dataRange = sourceSheet.getRange(range);
  var data = dataRange.getValues();
  var targetCells = destSheet.getRange(destRange);
  targetCells.setValues(data);
  targetCells.setBorder(
    true,
    true,
    true,
    true,
    false,
    true,
    "black",
    SpreadsheetApp.BorderStyle.SOLID
  );
  return destRange;
}

function compareSheetDataFromRange(
  sourceSheet,
  destSheet,
  range,
  destRange,
  offset_i,
  balance
) {
  var sourceDataRange = sourceSheet.getRange(range);
  var sourceData = sourceDataRange.getValues();
  var destDataRange = destSheet.getRange(destRange);
  var destData = destDataRange.getValues();
  var changed = false;
  var offset = offset_i * DEFAULT_OFFSET;
  var type = 0;
  if (balance) type = 7;
  for (var i = 0; i < sourceData.length; i++) {
    for (var j = 0; j < sourceData[i].length; j++) {
      if (i == 0 || i == 3) continue; // (Err I don't even know what this is)
      if (sourceData[i][j] !== destData[i][j]) {
        destSheet
          .getRange(i + 2 + offset, j + 1 + type)
          .setBackground("yellow");
        changed = true;
      }
    }
  }
  if (changed) {
    if (balance) return sourceData[3][3];
    else return sourceData[0][0];
  }
  return null;
}

function createNewSpreadsheet(destSpreadsheet, spreadsheetName) {
  var yourNewSheet = destSpreadsheet.getSheetByName(spreadsheetName);
  if (yourNewSheet == null) {
    yourNewSheet = destSpreadsheet.insertSheet();
    yourNewSheet.setName(spreadsheetName);
  }
  return yourNewSheet;
}
