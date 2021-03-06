import { Box, Flex } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { v4 as uuid } from 'uuid';
import { isEmpty } from 'lodash';

import Container from '../Container';
import { I18nBold } from '../I18nFormatters';
import StyledButton from '../StyledButton';
import StyledDropzone from '../StyledDropzone';
import { P, Span } from '../Text';
import ExpenseItemForm from './ExpenseItemForm';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';
import { toIsoDateStr } from '../../lib/date-utils';
import expenseTypes from '../../lib/constants/expenseTypes';
import ExpenseItemsTotalAmount from './ExpenseItemsTotalAmount';

/** Init a new expense item with default attributes */
const newExpenseItem = attrs => ({
  id: uuid(), // we generate it here to properly key lists, but it won't be submitted to API
  incurredAt: toIsoDateStr(new Date()),
  description: '',
  amount: null,
  url: '',
  __isNew: true,
  ...attrs,
});

/** Converts a list of filenames to expense item objects */
const filesListToItems = files => files.map(url => newExpenseItem({ url }));

export default class ExpenseFormItems extends React.PureComponent {
  static propTypes = {
    /** Array helper as provided by formik */
    push: PropTypes.func.isRequired,
    /** Array helper as provided by formik */
    remove: PropTypes.func.isRequired,
    /** Formik */
    form: PropTypes.shape({
      values: PropTypes.object.isRequired,
      touched: PropTypes.object,
      errors: PropTypes.object,
    }).isRequired,
  };

  componentDidMount() {
    this.addDefaultItemIfEmpty();
  }

  componentDidUpdate() {
    this.addDefaultItemIfEmpty();
  }

  addDefaultItemIfEmpty() {
    const { values } = this.props.form;
    if (values.type === expenseTypes.INVOICE && isEmpty(values.items)) {
      this.props.push(newExpenseItem());
    }
  }

  remove = item => {
    const idx = this.props.form.values.items.findIndex(a => a.id === item.id);
    if (idx !== -1) {
      this.props.remove(idx);
    }
  };

  render() {
    const { values, errors } = this.props.form;
    const requireFile = attachmentRequiresFile(values.type);
    const items = values.items || [];
    const hasItems = items.length > 0;

    if (!hasItems && requireFile) {
      return (
        <StyledDropzone
          {...attachmentDropzoneParams}
          data-cy="expense-multi-attachments-dropzone"
          onSuccess={files => filesListToItems(files).map(this.props.push)}
          showDefaultMessage
          mockImageGenerator={index => `https://loremflickr.com/120/120/invoice?lock=${index}`}
          mb={3}
        >
          <P color="black.700" mt={1}>
            <FormattedMessage
              id="MultipleAttachmentsDropzone.UploadWarning"
              defaultMessage="<i18n-bold>Important</i18n-bold>: Expenses will not be paid without a valid receipt."
              values={{ 'i18n-bold': I18nBold }}
            />
          </P>
        </StyledDropzone>
      );
    }

    const onRemove = requireFile || items.length > 1 ? this.remove : null;
    return (
      <Box>
        {items.map((attachment, index) => (
          <ExpenseItemForm
            key={`item-${attachment.id}`}
            attachment={attachment}
            currency={values.currency}
            name={`items[${index}]`}
            errors={errors}
            onRemove={onRemove}
            requireFile={requireFile}
          />
        ))}
        <StyledButton
          type="button"
          buttonStyle="secondary"
          width="100%"
          onClick={() => {
            this.props.push(newExpenseItem());
            if (!hasItems) {
              this.props.push(newExpenseItem());
            }
          }}
        >
          <Span mr={2}>
            {requireFile ? (
              <FormattedMessage id="ExpenseForm.AddReceipt" defaultMessage="Add another receipt" />
            ) : (
              <FormattedMessage id="ExpenseForm.AddLineItem" defaultMessage="Add another line item" />
            )}
          </Span>
          <Span fontWeight="bold">+</Span>
        </StyledButton>
        <Container display="flex" borderTop="1px dashed #eaeaea" my={3} pt={3} justifyContent="flex-end">
          <Flex alignItems="center">
            <Container fontSize="Caption" fontWeight="bold" mr={3} whiteSpace="nowrap">
              <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
            </Container>
            <ExpenseItemsTotalAmount name={name} currency={values.currency} items={items} />
          </Flex>
        </Container>
      </Box>
    );
  }
}
